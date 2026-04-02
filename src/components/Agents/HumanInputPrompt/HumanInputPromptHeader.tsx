import { Hand, Loader2 } from "lucide-react";
import type { HumanInputConfig } from "@/types";

interface HumanInputPromptHeaderProps {
  config: HumanInputConfig;
}

export function HumanInputPromptHeader({ config }: HumanInputPromptHeaderProps) {
  return (
    <div className="flex items-start gap-3 px-4 pt-4 pb-2">
      <div className="relative flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700">
          <Hand className="h-4 w-4" />
        </div>
        <div className="absolute -inset-1 rounded-xl border border-amber-500/15 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-800/70">
            Human Input Required
          </span>
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-800/60">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            Waiting
          </span>
        </div>
        <p className="text-[12px] font-medium text-text-main leading-relaxed">{config.question}</p>
        {config.context && (
          <p className="mt-1 text-[10px] text-text-muted/70 leading-relaxed">{config.context}</p>
        )}
      </div>
    </div>
  );
}
