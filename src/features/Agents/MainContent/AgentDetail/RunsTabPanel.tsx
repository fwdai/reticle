import { CheckCircle2, XCircle, Loader2, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RunRecord } from "./types";

interface RunsTabPanelProps {
  runs: RunRecord[];
}

export function RunsTabPanel({ runs }: RunsTabPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
      <div className="space-y-2">
        {runs.map((run) => (
          <div
            key={run.id}
            className={cn(
              "group rounded-xl border border-border-light bg-white p-4 cursor-pointer hover:border-slate-300 transition-colors",
              run.status === "running" && "border-primary/30"
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                  run.status === "success" && "bg-green-100 text-green-600",
                  run.status === "error" && "bg-red-100 text-red-600",
                  run.status === "running" && "bg-primary/10 text-primary"
                )}
              >
                {run.status === "success" && <CheckCircle2 className="h-4 w-4" />}
                {run.status === "error" && <XCircle className="h-4 w-4" />}
                {run.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text-main font-mono">{run.id}</span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      run.status === "success" && "text-green-600",
                      run.status === "error" && "text-red-600",
                      run.status === "running" && "text-primary"
                    )}
                  >
                    {run.status}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted">{run.timestamp}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Loops
                  </span>
                  <span className="text-xs font-mono text-text-main">{run.loops}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Tokens
                  </span>
                  <span className="text-xs font-mono text-text-main">{run.tokens}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Cost
                  </span>
                  <span className="text-xs font-mono text-primary">{run.cost}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Latency
                  </span>
                  <span className="text-xs font-mono text-text-main">{run.latency}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <ExternalLink className="h-3 w-3" />
                  Trace
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                  <BarChart3 className="h-3 w-3" />
                  Compare
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
