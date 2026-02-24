import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatBlockProps {
  label: string;
  value: string;
  delta?: number;
  positive?: boolean;
}

export function StatBlock({
  label,
  value,
  delta,
  positive,
}: StatBlockProps) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="font-mono text-2xl font-bold text-foreground">{value}</div>
      {delta !== undefined && (
        <div className="flex items-center gap-1">
          {positive ? (
            <ArrowDownRight className="h-3 w-3 text-success" />
          ) : (
            <ArrowUpRight className="h-3 w-3 text-destructive" />
          )}
          <span
            className={cn(
              "font-mono text-[11px] font-medium",
              positive ? "text-success" : "text-destructive"
            )}
          >
            {Math.abs(delta)}%
          </span>
          <span className="text-[10px] text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
