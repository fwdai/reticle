import { useState } from "react";
import { Check, ChevronRight, Key, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CredentialsWidgetProps {
  submitting: boolean;
  onSubmit: () => void;
}

export function CredentialsWidget({ submitting, onSubmit }: CredentialsWidgetProps) {
  const [linked, setLinked] = useState(false);

  return (
    <div className="mt-2 space-y-2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border px-3 py-3 transition-all duration-300",
          linked
            ? "border-green-500/30 bg-green-500/[0.04]"
            : "border-border-light bg-white/50 hover:border-amber-500/30",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            linked ? "bg-green-500/15 text-green-700" : "bg-amber-500/10 text-amber-700",
          )}
        >
          <Key className={cn("h-4 w-4", !linked && "animate-pulse")} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-medium text-text-main">
            {linked ? "Credentials linked" : "API credentials required"}
          </p>
          <p className="text-[10px] text-text-muted/60">
            {linked ? "OAuth token verified and ready" : "Connect your account to continue"}
          </p>
        </div>
        {!linked && (
          <button
            type="button"
            onClick={() => setLinked(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold text-amber-800 hover:bg-amber-500/15 transition-all"
          >
            <Key className="h-3 w-3" />
            Connect
          </button>
        )}
        {linked && <Check className="h-4 w-4 text-green-600" />}
      </div>
      {linked && (
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
            <ChevronRight className="h-3 w-3" />
          )}
          Continue
        </button>
      )}
    </div>
  );
}
