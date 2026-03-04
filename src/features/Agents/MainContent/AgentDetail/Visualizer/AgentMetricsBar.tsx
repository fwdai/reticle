import { CheckCircle2, Timer, Hash, Coins, XCircle, RotateCcw, Layers } from "lucide-react";
import { MetricPill } from "@/components/ui/MetricPill";
import { MiniTag } from "@/components/Visualizer";
import { useAgentContext } from "@/contexts/AgentContext";
import { formatTokens, formatCost } from "@/lib/helpers/format";
import { calculateRequestCost } from "@/lib/modelPricing";

export function AgentMetricsBar() {
  const { execution } = useAgentContext();

  const formatLatency = (seconds?: number) => {
    if (seconds == null) return "—";
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const cost = (() => {
    const tokens = execution?.tokens;
    const provider = execution?.provider;
    const model = execution?.model;
    if (!tokens || !provider || !model) return null;
    const inputTokens = Math.round(tokens * 0.8);
    const outputTokens = Math.round(tokens * 0.2);
    return calculateRequestCost(provider, model, { inputTokens, outputTokens });
  })();

  const loopCount =
    execution?.steps?.length > 0
      ? Math.max(...execution.steps.map((s) => s.loop ?? 0), 0)
      : 0;

  const statusValue =
    execution?.status === "error"
      ? "Error"
      : execution?.status === "success"
        ? "Resolved"
        : execution?.status === "running"
          ? "Running..."
          : "—";
  const statusVariant =
    execution?.status === "error" ? "warning" : execution?.status === "success" ? "success" : "default";
  const statusIcon = execution?.status === "error" ? XCircle : CheckCircle2;

  return (
    <div className="flex items-center gap-3 border-b border-border-light bg-slate-50 px-6 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Layers className="h-3.5 w-3.5" />
        Agent Execution Flow
      </div>
      <div className="mx-3 h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <MetricPill icon={statusIcon} label="Status" value={statusValue} variant={statusVariant} />
        <MetricPill
          icon={Timer}
          label="Total"
          value={
            execution?.status === "running" && execution.elapsedSeconds != null
              ? formatLatency(execution.elapsedSeconds)
              : execution?.status === "success"
                ? "—"
                : "—"
          }
          variant={execution?.status === "success" ? "accent" : undefined}
        />
        <MetricPill icon={RotateCcw} label="Loops" value={String(loopCount)} />
        <MetricPill icon={Hash} label="Tokens" value={formatTokens(execution?.tokens)} />
        <MetricPill icon={Coins} label="Cost" value={formatCost(cost)} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {execution?.status === "success" && (
          <MiniTag variant="accent">COMPLETED</MiniTag>
        )}
        {execution?.status === "running" && <MiniTag variant="accent">RUNNING</MiniTag>}
        {execution?.status === "error" && <MiniTag variant="muted">FAILED</MiniTag>}
      </div>
    </div>
  );
}
