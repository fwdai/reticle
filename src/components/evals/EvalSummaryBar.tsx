import { Check, X, Clock, Zap, Coins, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvalSummaryBarProps {
  totalCount: number;
  runningCount: number;
  passCount: number;
  failCount: number;
  avgLatency: number;
  running: boolean;
  hasResults: boolean;
  onRunSuite: () => void;
  totalCost?: number;
}

export function EvalSummaryBar({
  totalCount,
  runningCount,
  passCount,
  failCount,
  avgLatency,
  running,
  hasResults,
  onRunSuite,
  totalCost,
}: EvalSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border-light bg-white px-5 py-2">
      <span className="text-sm font-semibold text-text-main">
        {totalCount} cases
      </span>
      <div className="h-4 w-px bg-border-light" />
      <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
        <Check className="h-3.5 w-3.5" /> {passCount} passed
      </span>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
        <X className="h-3.5 w-3.5" /> {failCount} failed
      </span>
      <div className="h-4 w-px bg-border-light" />
      {totalCost !== undefined && (
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Coins className="h-3 w-3" /> ${totalCost.toFixed(4)}
        </span>
      )}
      <span className="flex items-center gap-1.5 text-xs text-text-muted">
        <Clock className="h-3 w-3" /> {avgLatency.toFixed(1)}s avg
      </span>
      {running && (
        <>
          <div className="h-4 w-px bg-border-light" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Zap className="h-3 w-3 animate-pulse" />
            Running {runningCount} / {totalCount}
          </span>
        </>
      )}
      <div className="ml-auto">
        {!running && (
          <Button
            size="sm"
            disabled={totalCount === 0}
            className="h-8 gap-2 bg-primary text-white hover:bg-primary/90 font-semibold px-4 disabled:opacity-40 disabled:shadow-none"
            onClick={onRunSuite}
          >
            {hasResults ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {hasResults ? "Re-run" : `Run Suite (${totalCount})`}
          </Button>
        )}
      </div>
    </div>
  );
}
