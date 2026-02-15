import { useState } from "react";
import {
  ArrowLeft,
  Play,
  GitBranch,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Coins,
  Hash,
  CheckCircle,
  XCircle,
  MessageSquare,
  Cpu,
  Wrench,
  FileText,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Run {
  id: string;
  name: string;
  model: string;
  status: string;
  latency: string;
  tokens: number;
  cost: string;
  time: string;
}

interface ExecutionTraceProps {
  run: Run;
  onBack: () => void;
}

interface TraceStep {
  id: string;
  type: string;
  label: string;
  icon: React.ElementType;
  status: "success" | "error";
  duration: string;
  timestamp: string;
  content: Record<string, unknown>;
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

export function ExecutionTrace({ run, onBack }: ExecutionTraceProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(["step_1"]));
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    <div className="flex flex-col h-full animate-fade-in">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Runs
          </button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-3">
            {run.status === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <div>
              <h2 className="text-sm font-bold text-foreground">{run.name}</h2>
              <span className="font-mono text-[11px] text-muted-foreground">{run.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Play className="h-3.5 w-3.5" />
            Re-run
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-accent/40 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 transition-colors btn-glow">
            <GitBranch className="h-3.5 w-3.5" />
            Fork
          </button>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="flex items-center gap-8 border-b border-border px-6 py-3 bg-panel">
        <MetricPill icon={Clock} label="Latency" value={run.latency} />
        <MetricPill icon={Hash} label="Tokens" value={run.tokens.toLocaleString()} />
        <MetricPill icon={Coins} label="Cost" value={run.cost} />
        <MetricPill icon={Zap} label="Model" value={run.model} mono />
        <MetricPill icon={MessageSquare} label="Steps" value={String(traceSteps.length)} />
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={expandAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Expand all
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Execution timeline */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="relative max-w-4xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border" />

          <div className="space-y-1">
            {traceSteps.map((step, idx) => {
              const isExpanded = expandedSteps.has(step.id);
              const Icon = step.icon;
              const isLast = idx === traceSteps.length - 1;

              return (
                <div key={step.id} className="relative">
                  {/* Timeline node */}
                  <div
                    className={cn(
                      "flex items-start gap-4 cursor-pointer group",
                      isExpanded && "mb-0"
                    )}
                    onClick={() => toggleStep(step.id)}
                  >
                    {/* Node dot */}
                    <div
                      className={cn(
                        "relative z-10 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200",
                        step.status === "success"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-destructive/30 bg-destructive/10 text-destructive",
                        isExpanded && step.status === "success" && "border-success/60 glow-success",
                        isExpanded && step.status === "error" && "border-destructive/60"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Header */}
                    <div className="flex-1 flex items-center justify-between py-2.5 pr-2">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                          {step.label}
                        </span>
                        <StepTypeBadge type={step.type} />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-muted-foreground">
                          {step.timestamp}
                        </span>
                        <span className="font-mono text-xs font-medium text-foreground">
                          +{step.duration}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyContent(step.id, step.content);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                          title="Copy payload"
                        >
                          {copiedId === step.id ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="ml-[62px] mb-4 animate-fade-in">
                      <div className="code-block overflow-x-auto text-[13px] leading-6">
                        <pre className="whitespace-pre-wrap break-words">
                          {renderStepContent(step)}
                        </pre>
                      </div>
                      {/* Token usage bar for model responses */}
                      {"usage" in (step.content as any) && (
                        <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-panel px-4 py-2.5">
                          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">USAGE</span>
                          <TokenStat label="Prompt" value={(step.content as any).usage.prompt_tokens} />
                          <TokenStat label="Completion" value={(step.content as any).usage.completion_tokens} />
                          <TokenStat label="Total" value={(step.content as any).usage.total_tokens} accent />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-sm font-semibold text-foreground", mono && "font-mono text-[13px]")}>
        {value}
      </span>
    </div>
  );
}

function StepTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    prompt_assembly: { label: "ASSEMBLY", className: "text-accent border-accent/30 bg-accent/10" },
    model_response: { label: "MODEL", className: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
    tool_call: { label: "TOOL CALL", className: "text-warning border-warning/30 bg-warning/10" },
    tool_response: { label: "TOOL RESP", className: "text-purple-400 border-purple-400/30 bg-purple-400/10" },
  };
  const style = map[type] || { label: type.toUpperCase(), className: "text-muted-foreground border-border" };

  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider", style.className)}>
      {style.label}
    </span>
  );
}

function TokenStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={cn("font-mono text-xs font-semibold", accent ? "text-accent" : "text-foreground")}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function renderStepContent(step: TraceStep): string {
  const c = step.content as any;
  if (step.type === "prompt_assembly") {
    return JSON.stringify(
      {
        model: c.model,
        temperature: c.temperature,
        max_tokens: c.max_tokens,
        messages: [
          { role: "system", content: c.system },
          ...c.messages,
        ],
      },
      null,
      2
    );
  }
  if (step.type === "model_response") {
    return c.chunks.join("") + `\n\n// finish_reason: "${c.finish_reason}"`;
  }
  if (step.type === "tool_call") {
    return JSON.stringify({ function: c.name, arguments: c.arguments }, null, 2);
  }
  if (step.type === "tool_response") {
    return JSON.stringify(c.result, null, 2);
  }
  return JSON.stringify(step.content, null, 2);
}
