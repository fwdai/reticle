import { Clock, Zap, Coins, Hash, CheckCircle2, XCircle } from "lucide-react";
import { MetricPill } from "@/components/ui/MetricPill";
import type { RunDetailRun } from "./types";
import type { RunViewMode } from "./Header";

interface MetricsBarProps {
  run: RunDetailRun;
  viewMode: RunViewMode;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function MetricsBar({
  run,
  viewMode,
  onExpandAll,
  onCollapseAll,
}: MetricsBarProps) {
  const success = run.status === "success";
  const statusIcon = success ? CheckCircle2 : XCircle;
  const statusValue = success ? "200 OK" : "Error";
  const statusVariant = success ? "success" : "warning"

  return (
    <div className="flex items-center gap-4 border-b border-border-light px-6 h-12 bg-slate-50">
      <div className="flex items-center gap-2 min-w-0">
        <MetricPill icon={statusIcon} label="Status" value={statusValue} variant={statusVariant} />

        <div className="h-4 w-px bg-border shrink-0" />
        <MetricPill icon={Clock} label="Latency" value={run.latency} />
        <MetricPill icon={Hash} label="Tokens" value={run.tokens.toLocaleString()} />
        <MetricPill icon={Coins} label="Cost" value={run.cost} />
        <MetricPill icon={Zap} label="Model" value={run.model} mono />
      </div>

      <div className="ml-auto flex items-center shrink-0">
        {viewMode === "timeline" && (
          <div className="flex items-center justify-end gap-3 px-4 leading-none">
            <button
              onClick={onExpandAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-none"
            >
              Expand all
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              onClick={onCollapseAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors leading-none"
            >
              Collapse all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
