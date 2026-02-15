import { cn } from "@/lib/utils";

export interface MetricPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: "default" | "success" | "accent" | "warning";
}

export function MetricPill({ icon: Icon, label, value, variant = "default" }: MetricPillProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
      variant === "default" && "border-border bg-card text-foreground",
      variant === "success" && "border-primary/20 bg-primary/5 text-primary",
      variant === "accent" && "border-accent/20 bg-accent/5 text-accent",
      variant === "warning" && "border-warning/20 bg-warning/5 text-warning",
    )}>
      <Icon className="h-3.5 w-3.5 opacity-60" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
