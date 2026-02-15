import { cn } from "@/lib/utils";

interface TokenStatProps {
  label: string;
  value: number;
  accent?: boolean;
}

export function TokenStat({ label, value, accent }: TokenStatProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-muted">{label}:</span>
      <span className={cn("font-mono text-xs font-semibold", accent ? "text-primary" : "text-text-main")}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
