import { useState, useEffect } from "react";
import { formatTokens } from "@/lib/helpers/format";
import { tilePalettes } from "./constants";

export interface ModelUsageItem {
  model: string;
  runs: number;
  tokens: number;
  percent: number;
}

interface ModelUsageCardProps {
  models: ModelUsageItem[];
}

const TOP_N = 5;

export function ModelUsageCard({ models }: ModelUsageCardProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const visible = models.slice(0, TOP_N);
  const hiddenCount = models.length - visible.length;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Model Usage</h3>
        <span className="text-[11px] text-muted-foreground">Last 7 days</span>
      </div>
      {models.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No runs yet</p>
      ) : (
        <div className="space-y-3">
          {visible.map((m, i) => (
            <div key={m.model}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[55%]">
                  {m.model}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {m.runs} runs · {formatTokens(m.tokens)} · {m.percent.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: animated ? `${m.percent}%` : "0%",
                    background:
                      i === 0
                        ? `hsl(${tilePalettes[0].bg})`
                        : i === 1
                          ? `hsl(${tilePalettes[1].bg})`
                          : `hsl(${tilePalettes[2].bg})`,
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          ))}
          {hiddenCount > 0 && (
            <p className="text-[11px] text-muted-foreground pt-1">
              +{hiddenCount} more model{hiddenCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
