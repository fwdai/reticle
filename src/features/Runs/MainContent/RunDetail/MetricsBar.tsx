import { Clock, Zap, Coins, Hash, MessageSquare } from "lucide-react";
import { MetricPill } from "./MetricPill";
import type { RunDetailRun } from "./types";
import type { RunViewMode } from "./Header";

interface MetricsBarProps {
  run: RunDetailRun;
  stepCount: number;
  viewMode: RunViewMode;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function MetricsBar({
  run,
  stepCount,
  viewMode,
  onExpandAll,
  onCollapseAll,
}: MetricsBarProps) {
  return (
    <div className="flex items-center gap-8 border-b border-border-light px-6 h-12 bg-slate-50">
      <MetricPill icon={Clock} label="Latency" value={run.latency} />
      <MetricPill icon={Hash} label="Tokens" value={run.tokens.toLocaleString()} />
      <MetricPill icon={Coins} label="Cost" value={run.cost} />
      <MetricPill icon={Zap} label="Model" value={run.model} mono />
      <MetricPill icon={MessageSquare} label="Steps" value={String(stepCount)} />

      <div className="ml-auto flex items-center">
        {viewMode === "timeline" && (
          <div className="flex items-center justify-end gap-3 px-4 shrink-0 leading-none">
            <button
              onClick={onExpandAll}
              className="text-xs text-text-muted hover:text-text-main transition-colors leading-none"
            >
              Expand all
            </button>
            <span className="text-text-muted/30">|</span>
            <button
              onClick={onCollapseAll}
              className="text-xs text-text-muted hover:text-text-main transition-colors leading-none"
            >
              Collapse all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
