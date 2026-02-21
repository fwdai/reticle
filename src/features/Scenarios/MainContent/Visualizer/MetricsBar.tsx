import { useContext } from "react";
import { CheckCircle2, Timer, Hash, Coins, XCircle } from "lucide-react";
import { MetricPill } from "@/components/ui/MetricPill";
import { MiniTag } from "./MiniTag";
import { StudioContext } from "@/contexts/StudioContext";
import { calculateRequestCost } from "@/lib/modelPricing";
import { formatTokens, formatCost } from "@/lib/helpers/format";

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

  const cost = (() => {
    const usage = response?.usage;
    if (!usage || (!usage.promptTokens && !usage.completionTokens && !usage.totalTokens)) return null;
    const provider = currentScenario?.configuration?.provider;
    const model = currentScenario?.configuration?.model;
    if (!provider || !model) return null;
    const inputTokens =
      usage.promptTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.8) : 0);
    const outputTokens =
      usage.completionTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.2) : 0);
    return calculateRequestCost(provider, model, { inputTokens, outputTokens });
  })();

  const statusValue = response?.error ? "Error" : response ? "200 OK" : isLoading ? "Running..." : "—";
  const statusVariant = response?.error ? "warning" : response ? "success" : "default";
  const statusIcon = response?.error ? XCircle : CheckCircle2;

  return (
    <div className="flex items-center gap-4 border-b border-border-light px-6 h-12 bg-slate-50">
      <div className="flex items-center gap-2 min-w-0">
        <MetricPill icon={statusIcon} label="Status" value={statusValue} variant={statusVariant} />

        <div className="h-4 w-px bg-border shrink-0" />
        <MetricPill
          icon={Timer}
          label="Latency"
          value={response?.latency != null ? formatLatency(response.latency) : "—"}
        />
        <MetricPill
          icon={Hash}
          label="Tokens"
          value={formatTokens(response?.usage?.totalTokens)}
        />
        <MetricPill icon={Coins} label="Cost" value={formatCost(cost)} />
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
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
