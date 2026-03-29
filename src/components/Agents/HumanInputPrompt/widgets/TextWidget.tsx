import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextWidgetProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  submitting: boolean;
  onSubmit: () => void;
}

export function TextWidget({
  value,
  onChange,
  placeholder,
  submitting,
  onSubmit,
}: TextWidgetProps) {
  return (
    <div className="mt-2 space-y-2">
      <div
        className={cn(
          "rounded-lg border bg-white/80 transition-all duration-200",
          "focus-within:border-primary/40 focus-within:shadow-[0_0_8px_-3px_hsl(var(--primary)/0.15)]",
          "border-border-light",
        )}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Type your response…"}
          disabled={submitting}
          rows={2}
          className="w-full resize-none border-none bg-transparent px-3 py-2.5 text-[12px] text-text-main placeholder:text-text-muted/35 focus:outline-none leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && value.trim()) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-text-muted/40 font-mono">
          {value.length > 0 ? `${value.length} chars` : "⏎ to submit"}
        </span>
        <button
          type="button"
          disabled={!value.trim() || submitting}
          onClick={onSubmit}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-[11px] font-semibold transition-all duration-200",
            value.trim()
              ? "bg-primary text-white hover:bg-primary/90 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]"
              : "bg-gray-100 text-text-muted/40 cursor-not-allowed",
            submitting && "opacity-60 pointer-events-none",
          )}
        >
          {submitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Submit
        </button>
      </div>
    </div>
  );
}
