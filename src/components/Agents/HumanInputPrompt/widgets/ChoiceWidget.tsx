import { Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptOption } from "@/types";

interface ChoiceWidgetProps {
  options: PromptOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}

export function ChoiceWidget({
  options,
  selected,
  onSelect,
  submitting,
  onSubmit,
}: ChoiceWidgetProps) {
  return (
    <div className="mt-2 space-y-2">
      <div className="grid gap-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              disabled={submitting}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                isSelected
                  ? "border-primary/40 bg-primary/[0.06] shadow-[0_0_8px_-3px_hsl(var(--primary)/0.2)]"
                  : "border-border-light bg-white/60 hover:border-text-muted/20 hover:bg-gray-50",
                opt.variant === "destructive" &&
                  isSelected &&
                  "border-red-500/40 bg-red-500/[0.06]",
                submitting && "opacity-50 pointer-events-none",
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border-light bg-white",
                )}
              >
                {isSelected && <Check className="h-2.5 w-2.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isSelected ? "text-text-main" : "text-text-main/70",
                  )}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="text-[10px] text-text-muted/60 mt-0.5">{opt.description}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={!selected || submitting}
        onClick={onSubmit}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-semibold transition-all duration-200",
          selected
            ? "bg-primary text-white hover:bg-primary/90 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]"
            : "bg-gray-100 text-text-muted/40 cursor-not-allowed",
          submitting && "opacity-60 pointer-events-none",
        )}
      >
        {submitting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Continue
      </button>
    </div>
  );
}
