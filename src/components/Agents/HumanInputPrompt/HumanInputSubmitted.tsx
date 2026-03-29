import { Check } from "lucide-react";

export function HumanInputSubmitted() {
  return (
    <div className="animate-in fade-in-0 rounded-xl border border-green-500/20 bg-green-500/[0.04] px-4 py-3 duration-300">
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15">
          <Check className="h-3 w-3 text-green-600" />
        </div>
        <span className="text-[11px] font-medium text-green-700/90">
          Input received — resuming agent
        </span>
      </div>
    </div>
  );
}
