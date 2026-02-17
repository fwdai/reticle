import { useState } from "react";
import { FileText, Cpu, Wrench, Send } from "lucide-react";
import { Header, type RunViewMode } from "./Header";
import { MetricsBar } from "./MetricsBar";
import { Timeline, type TraceStep } from "./Timeline";
import { Visualizer } from "./Visualizer";
import type { RunDetailRun } from "./types";

export type { RunDetailRun } from "./types";

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
      <Header
        run={run}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBack={onBack}
      />
      <MetricsBar
        run={run}
        stepCount={traceSteps.length}
        viewMode={viewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
      {/* Execution timeline or visualizer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === "timeline" ? "p-6" : "p-0"}`}
        >
          {viewMode === "timeline" ? (
            <Timeline
              traceSteps={traceSteps}
              expandedSteps={expandedSteps}
              onToggleStep={toggleStep}
              onCopyContent={copyContent}
              copiedId={copiedId}
            />
          ) : (
            <Visualizer traceSteps={traceSteps} run={run} />
          )}
        </div>
      </div>
    </div >
  );
}
