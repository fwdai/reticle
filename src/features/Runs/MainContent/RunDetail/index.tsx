import { useState } from "react";
import {
  ArrowLeft,
  Play,
  GitBranch,
  Clock,
  Zap,
  Coins,
  Hash,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Cpu,
  Wrench,
  Send,
} from "lucide-react";
import Header from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { MetricPill } from "./MetricPill";
import { TraceStepItem, type TraceStep } from "./TraceStepItem";
import { FlowCanvas, type FlowCanvasProps } from "@/features/Studio/MainContent/Visualizer/FlowCanvas";

function inferProviderFromModel(model: string): string {
  if (model.startsWith("gpt-") || model.startsWith("o1-") || model.startsWith("o3-")) return "openai";
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-")) return "google";
  return "openai";
}

function traceStepsToFlowCanvasProps(traceSteps: TraceStep[], run: RunDetailRun): FlowCanvasProps {
  const promptStep = traceSteps.find((s) => s.type === "prompt_assembly");
  const promptContent = promptStep?.content as Record<string, unknown> | undefined;
  const modelResponses = traceSteps.filter((s) => s.type === "model_response");
  const lastModelResponse = modelResponses[modelResponses.length - 1];
  const lastContent = lastModelResponse?.content as Record<string, unknown> | undefined;
  const toolCallCount = traceSteps.filter((s) => s.type === "tool_call").length;

  const system = typeof promptContent?.system === "string" ? promptContent.system : "";
  const messages = Array.isArray(promptContent?.messages) ? promptContent.messages as { role?: string; content?: string }[] : [];
  const firstUser = messages.find((m) => m.role === "user");
  const userPrompt = typeof firstUser?.content === "string" ? firstUser.content : "";

  const firstUserIdx = firstUser ? messages.indexOf(firstUser) : -1;
  const history = (firstUserIdx >= 0 ? messages.slice(firstUserIdx + 1) : [])
    .filter((m): m is { role: "user" | "assistant"; content: string } =>
      (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    ) as { role: "user" | "assistant"; content: string }[];

  const model = typeof promptContent?.model === "string" ? promptContent.model : run.model;
  const provider = inferProviderFromModel(model);

  const chunks = Array.isArray(lastContent?.chunks) ? lastContent.chunks as string[] : [];
  const usage = lastContent?.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  const response = lastModelResponse
    ? {
        text: chunks.join(""),
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        error: run.status === "error" ? "Run failed" : undefined,
      }
    : null;

  const temp = typeof promptContent?.temperature === "number" ? promptContent.temperature : 0.7;
  const maxTokens = typeof promptContent?.max_tokens === "number" ? promptContent.max_tokens : 2048;

  const tools = Array.from({ length: toolCallCount }, (_, i) => ({
    id: String(i),
    name: `tool_${i}`,
    description: "",
    parameters: [],
    mockResponse: "",
  }));

  return {
    systemPrompt: system,
    userPrompt,
    attachments: [],
    tools,
    configuration: {
      provider,
      model,
      temperature: temp,
      topP: 1,
      maxTokens,
    },
    history,
    response,
    providerModels: {},
  };
}

export interface RunDetailRun {
  id: string;
  scenarioName: string;
  status: "success" | "error";
  model: string;
  latency: string;
  tokens: number;
  cost: string;
  timestamp: string;
}

interface RunDetailProps {
  run: RunDetailRun;
  onBack: () => void;
}

// Mock trace data for the execution
const traceSteps: TraceStep[] = [
  {
    id: "step_1",
    type: "prompt_assembly",
    label: "Prompt Assembled",
    icon: FileText,
    status: "success",
    duration: "12ms",
    timestamp: "00:00.000",
    content: {
      system: "You are a helpful customer support routing agent. Analyze the incoming message and route it to the appropriate department.",
      messages: [
        { role: "user", content: "I was charged twice for my subscription last month and I need a refund. My account ID is ACC-4829." },
      ],
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 1024,
    },
  },
  {
    id: "step_2",
    type: "model_response",
    label: "Model Response",
    icon: Cpu,
    status: "success",
    duration: "842ms",
    timestamp: "00:00.012",
    content: {
      chunks: [
        'I\'ll help you with this billing issue. Let me look up your account.',
        '\n\nFirst, I need to call the billing tool to check your recent charges.',
      ],
      finish_reason: "tool_calls",
      usage: { prompt_tokens: 284, completion_tokens: 156, total_tokens: 440 },
    },
  },
  {
    id: "step_3",
    type: "tool_call",
    label: "Tool Call → lookup_billing",
    icon: Wrench,
    status: "success",
    duration: "0ms",
    timestamp: "00:00.854",
    content: {
      name: "lookup_billing",
      arguments: {
        account_id: "ACC-4829",
        date_range: "last_30_days",
      },
    },
  },
  {
    id: "step_4",
    type: "tool_response",
    label: "Tool Response ← lookup_billing",
    icon: Send,
    status: "success",
    duration: "289ms",
    timestamp: "00:00.854",
    content: {
      result: {
        account_id: "ACC-4829",
        charges: [
          { date: "2024-01-15", amount: "$29.99", description: "Pro Subscription" },
          { date: "2024-01-15", amount: "$29.99", description: "Pro Subscription (duplicate)" },
        ],
        status: "duplicate_detected",
      },
    },
  },
  {
    id: "step_5",
    type: "model_response",
    label: "Final Model Response",
    icon: Cpu,
    status: "success",
    duration: "398ms",
    timestamp: "00:01.143",
    content: {
      chunks: [
        "I found the issue. You were indeed charged twice on January 15th for your Pro Subscription — $29.99 each time. ",
        "I'm routing this to our billing department with a recommendation for an immediate refund of the duplicate charge. ",
        "\n\n**Action taken:** Escalated to Billing with refund recommendation.\n**Reference:** REF-8842\n**Expected resolution:** 2-3 business days.",
      ],
      finish_reason: "stop",
      usage: { prompt_tokens: 580, completion_tokens: 262, total_tokens: 842 },
    },
  },
];

type RunViewMode = "timeline" | "visualizer";

export function RunDetail({ run, onBack }: RunDetailProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(["step_1"]));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<RunViewMode>("timeline");

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSteps(new Set(traceSteps.map((s) => s.id)));
  const collapseAll = () => setExpandedSteps(new Set());

  const copyContent = (id: string, content: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0">
      {/* Top toolbar */}
      <Header>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Runs
          </button>
          <div className="h-5 w-px bg-border-light" />
          <div className="flex items-center gap-3 leading-none">
            {run.status === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <h2 className="text-sm font-bold text-text-main">{run.scenarioName}</h2>
              <span className="font-mono text-[11px] text-text-muted">{run.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SegmentedSwitch<RunViewMode>
            options={[
              { value: "timeline", label: "Timeline" },
              { value: "visualizer", label: "Visualizer" },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
          <div className="h-6 w-px bg-border-light"></div>
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="h-3.5 w-3.5" />
            Re-run
          </Button>
          <Button size="sm" className="gap-2">
            <GitBranch className="h-3.5 w-3.5" />
            Fork
          </Button>
        </div>
      </Header>

      {/* Metrics bar */}
      <div className="flex items-center gap-8 border-b border-border-light px-6 h-12 bg-slate-50">
        <MetricPill icon={Clock} label="Latency" value={run.latency} />
        <MetricPill icon={Hash} label="Tokens" value={run.tokens.toLocaleString()} />
        <MetricPill icon={Coins} label="Cost" value={run.cost} />
        <MetricPill icon={Zap} label="Model" value={run.model} mono />
        <MetricPill icon={MessageSquare} label="Steps" value={String(traceSteps.length)} />

        <div className="ml-auto flex items-center">
          {viewMode === "timeline" && (
            <div className="flex items-center justify-end gap-3 px-4 shrink-0 leading-none">
              <button
                onClick={expandAll}
                className="text-xs text-text-muted hover:text-text-main transition-colors leading-none"
              >
                Expand all
              </button>
              <span className="text-text-muted/30">|</span>
              <button
                onClick={collapseAll}
                className="text-xs text-text-muted hover:text-text-main transition-colors leading-none"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Execution timeline */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === "timeline" ? "p-6" : "p-0"}`}
        >
          {viewMode === "timeline" ? (
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border-light" />

              <div className="space-y-1">
                {traceSteps.map((step) => (
                  <TraceStepItem
                    key={step.id}
                    step={step}
                    isExpanded={expandedSteps.has(step.id)}
                    onToggle={() => toggleStep(step.id)}
                    onCopy={copyContent}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-0 flex flex-col">
              <FlowCanvas {...traceStepsToFlowCanvasProps(traceSteps, run)} />
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
