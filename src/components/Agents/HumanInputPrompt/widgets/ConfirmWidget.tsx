import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmWidgetProps {
  confirmLabel: string;
  cancelLabel: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmWidget({
  confirmLabel,
  cancelLabel,
  submitting,
  onConfirm,
  onCancel,
}: ConfirmWidgetProps) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        type="button"
        disabled={submitting}
        onClick={onConfirm}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-semibold transition-all duration-200",
          "bg-primary text-white hover:bg-primary/90",
          "shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]",
          submitting && "opacity-60 pointer-events-none",
        )}
      >
        {submitting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Check className="h-3 w-3" />
        )}
        {confirmLabel}
      </button>
      <button
        type="button"
        disabled={submitting}
        onClick={onCancel}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-[11px] font-medium transition-all",
          "text-text-muted hover:text-text-main hover:border-text-muted/30 hover:bg-gray-50",
          submitting && "opacity-40 pointer-events-none",
        )}
      >
        <X className="h-3 w-3" />
        {cancelLabel}
      </button>
    </div>
  );
}
