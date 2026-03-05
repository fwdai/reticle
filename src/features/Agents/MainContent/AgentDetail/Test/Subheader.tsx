import {
  ArrowLeft,
  Play,
  RotateCcw,
  FlaskConical,
  Code,
  AlignLeft,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubheaderProps {
  innerMode: "edit" | "run" | "compareRuns";
  viewMode: "table" | "json";
  casesCount: number;
  validCount: number;
  running: boolean;
  onBackToEdit: () => void;
  onRunSuite: () => void;
  onSwitchToTable: () => void;
  onSwitchToJson: () => void;
  onCompareRuns: () => void;
}

export function Subheader({
  innerMode,
  viewMode,
  casesCount,
  validCount,
  running,
  onBackToEdit,
  onRunSuite,
  onSwitchToTable,
  onSwitchToJson,
  onCompareRuns,
}: SubheaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border-light px-6 h-12 bg-slate-50">
      <div className="flex items-center gap-3">
        {(innerMode === "run" || innerMode === "compareRuns") && (
          <button
            onClick={onBackToEdit}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Edit
          </button>
        )}
        {innerMode === "edit" && (
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-text-main">
              Agent Eval Suite
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-text-muted">
              {casesCount} CASE{casesCount !== 1 ? "S" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {innerMode === "edit" && (
          <>
            <div className="flex items-center rounded-lg border border-border-light bg-white p-0.5">
              <button
                onClick={() => (viewMode === "json" ? onSwitchToTable() : undefined)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all",
                  viewMode === "table"
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                <AlignLeft className="h-3 w-3" />
                TABLE
              </button>
              <button
                onClick={() => (viewMode === "table" ? onSwitchToJson() : undefined)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all",
                  viewMode === "json"
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                <Code className="h-3 w-3" />
                JSON
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-2 font-semibold px-4"
              onClick={onCompareRuns}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Compare Runs
            </Button>

            <Button
              size="sm"
              disabled={validCount === 0}
              className="h-9 gap-2 bg-primary text-white hover:bg-primary/90 font-semibold px-5 disabled:opacity-40 disabled:shadow-none"
              onClick={onRunSuite}
            >
              <Play className="h-3.5 w-3.5" />
              Run Suite ({validCount})
            </Button>
          </>
        )}

        {innerMode === "run" && !running && (
          <Button
            size="sm"
            className="h-9 gap-2 bg-primary text-white hover:bg-primary/90 font-semibold px-5"
            onClick={onRunSuite}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Re-run
          </Button>
        )}
      </div>
    </div>
  );
}
