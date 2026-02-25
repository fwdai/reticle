import { FileCode, Zap, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RecentRun {
  id: string;
  name: string;
  type: "scenario" | "agent";
  model: string;
  status: "success" | "error";
  tokens: number;
  cost: number;
  time: string;
}

interface RecentRunsListProps {
  runs: RecentRun[];
  onViewAll: () => void;
}

export function RecentRunsList({ runs, onViewAll }: RecentRunsListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Recent Runs</h3>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent/80"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Column headers */}
      <div className="mb-1 grid grid-cols-[1fr_120px_80px_70px_70px] sm:grid-cols-[1fr_140px_100px_80px_80px] items-center px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>Name</span>
        <span>Model</span>
        <span className="text-right">Tokens</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Status</span>
      </div>

      {runs.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          No runs yet. Create a scenario and run it to see results here.
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/50">
            {runs.map((run) => (
              <div
                key={run.id}
                className="group grid grid-cols-[1fr_120px_80px_70px_70px] sm:grid-cols-[1fr_140px_100px_80px_80px] items-center rounded-lg px-3 py-3 transition-colors hover:bg-card/60"
              >
                {/* Name + type badge */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {run.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      run.type === "agent"
                        ? "bg-accent/10 text-accent"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {run.type === "agent" ? (
                      <Zap className="h-2.5 w-2.5" />
                    ) : (
                      <FileCode className="h-2.5 w-2.5" />
                    )}
                    {run.type}
                  </span>
                </div>

                {/* Model */}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {run.model}
                </span>

                {/* Tokens */}
                <span className="text-right font-mono text-[11px] text-muted-foreground">
                  {run.tokens.toLocaleString()}
                </span>

                {/* Cost */}
                <span className="text-right font-mono text-[11px] text-muted-foreground">
                  ${run.cost.toFixed(3)}
                </span>

                {/* Status */}
                <div className="flex items-center justify-end gap-1.5">
                  {run.status === "success" ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                      <span className="text-[11px] font-medium text-success">
                        OK
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-[11px] font-medium text-destructive">
                        Fail
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onViewAll}
              className="flex w-full items-center justify-center rounded-lg px-3 py-3 transition-colors hover:bg-card/60 cursor-pointer"
            >
              <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                See more
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
