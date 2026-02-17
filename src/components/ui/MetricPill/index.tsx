import { cn } from "@/lib/utils";

export interface MetricPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: "default" | "success" | "accent" | "warning";
  mono?: boolean;
}

export function MetricPill({
  icon: Icon,
  label,
  value,
  variant = "default",
  mono = true,
}: MetricPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        variant === "default" && "border-border-light bg-card text-foreground",
        variant === "success" && "border-green-500/20 bg-green-500/5 text-green-500",
        variant === "accent" && "border-accent/20 bg-accent/5 text-accent",
        variant === "warning" && "border-red-500/30 bg-red-500/5 text-red-500",
      )}
    >
      <Icon className="h-3.5 w-3.5 opacity-60" />
      <span className="">{label}</span>
      <span
        className={cn(
          "font-semibold text-foreground",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
}
