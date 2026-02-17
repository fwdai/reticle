import { useContext } from "react";
import { Layers, CheckCircle2, Timer, Hash, Coins, XCircle } from "lucide-react";
import { MetricPill } from "./MetricPill";
import { MiniTag } from "./MiniTag";
import { StudioContext } from "@/contexts/StudioContext";
import { calculateRequestCost } from "@/lib/modelPricing";

export function MetricsBar() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("MetricsBar must be used within a StudioProvider");
  }

  const { studioState } = context;
  const { response, isLoading, currentScenario } = studioState;

  const formatLatency = (ms?: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = () => {
    const usage = response?.usage;
    if (!usage || (!usage.promptTokens && !usage.completionTokens && !usage.totalTokens)) return "—";
    const provider = currentScenario?.configuration?.provider;
    const model = currentScenario?.configuration?.model;
    if (!provider || !model) return "—";
    const inputTokens =
      usage.promptTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.8) : 0);
    const outputTokens =
      usage.completionTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.2) : 0);
    const cost = calculateRequestCost(provider, model, { inputTokens, outputTokens });
    return cost != null ? `$${cost.toFixed(4)}` : "—";
  };

  const statusValue = response?.error ? "Error" : response ? "200 OK" : isLoading ? "Running..." : "—";
  const statusVariant = response?.error ? "warning" : response ? "success" : "default";
  const statusIcon = response?.error ? XCircle : CheckCircle2;

  return (
    <div className="flex items-center gap-3 border-b border-border bg-panel px-6 py-3 bg-slate-50">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground">
        <Layers className="h-3.5 w-3.5" />
        Pipeline Overview
      </div>
      <div className="mx-3 h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <MetricPill icon={statusIcon} label="Status" value={statusValue} variant={statusVariant} />
        <MetricPill
          icon={Timer}
          label="Latency"
          value={response?.latency != null ? formatLatency(response.latency) : "—"}
          variant={response?.latency != null ? "accent" : "default"}
        />
        <MetricPill
          icon={Hash}
          label="Tokens"
          value={response?.usage?.totalTokens?.toString() ?? "—"}
        />
        <MetricPill icon={Coins} label="Cost" value={formatCost()} />
      </div>
      <div className="ml-auto flex items-center gap-2">
        {response && (
          <MiniTag variant={response.error ? "muted" : "accent"}>
            {response.error ? "FAILED" : "COMPLETED"}
          </MiniTag>
        )}
        {isLoading && (
          <MiniTag variant="accent">RUNNING</MiniTag>
        )}
      </div>
    </div>
  );
}
