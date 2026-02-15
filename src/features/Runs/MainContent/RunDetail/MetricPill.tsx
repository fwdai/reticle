import { cn } from "@/lib/utils";

interface MetricPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}

export function MetricPill({ icon: Icon, label, value, mono }: MetricPillProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-text-muted" />
      <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">{label}</span>
      <span className={cn("text-sm font-semibold text-text-main", mono && "font-mono text-[13px]")}>
        {value}
      </span>
    </div>
  );
}
