import { cn } from "@/lib/utils";

interface StepTypeBadgeProps {
  type: string;
}

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  prompt_assembly: { label: "ASSEMBLY", className: "text-primary border-primary/30 bg-primary/10" },
  model_response: { label: "MODEL", className: "text-blue-600 border-blue-200 bg-blue-50" },
  tool_call: { label: "TOOL CALL", className: "text-amber-700 border-amber-200 bg-amber-50" },
  tool_response: { label: "TOOL RESP", className: "text-purple-600 border-purple-200 bg-purple-50" },
};

export function StepTypeBadge({ type }: StepTypeBadgeProps) {
  const style = TYPE_STYLES[type] || {
    label: type.toUpperCase(),
    className: "text-text-muted border-border-light bg-slate-100",
  };

  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider", style.className)}>
      {style.label}
    </span>
  );
}
