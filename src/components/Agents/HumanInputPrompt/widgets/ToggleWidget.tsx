import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptOption } from "@/types";

interface ToggleWidgetProps {
  value: boolean;
  onChange: (v: boolean) => void;
  options?: PromptOption[];
  submitting: boolean;
  onSubmit: () => void;
}

export function ToggleWidget({
  value,
  onChange,
  options,
  submitting,
  onSubmit,
}: ToggleWidgetProps) {
  const onLabel = options?.[0]?.label || "Enable";
  const offLabel = options?.[1]?.label || "Disable";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(!value)}
          disabled={submitting}
          className={cn(
            "relative h-6 w-11 rounded-full transition-all duration-300",
            value
              ? "bg-primary shadow-[0_0_8px_-2px_hsl(var(--primary)/0.4)]"
              : "bg-text-muted/20",
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300",
              value ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
        <span className="text-[11px] font-medium text-text-main">
          {value ? onLabel : offLabel}
        </span>
      </div>
      <button
        type="button"
        disabled={submitting}
        onClick={onSubmit}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-semibold transition-all",
          "bg-primary text-white hover:bg-primary/90 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]",
          submitting && "opacity-60 pointer-events-none",
        )}
      >
        {submitting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        Apply
      </button>
    </div>
  );
}
