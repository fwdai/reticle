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

export function ModelUsageCard({ models }: ModelUsageCardProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Model Usage</h3>
        <span className="text-[11px] text-muted-foreground">Last 7 days</span>
      </div>
      {models.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No runs yet</p>
      ) : (
        <div className="space-y-5">
          {models.map((m, i) => (
            <div key={m.model} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {m.model}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {m.runs} runs · {formatTokens(m.tokens)}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
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
              <span className="text-[11px] text-muted-foreground">
                {m.percent.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
