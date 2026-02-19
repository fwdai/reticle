import { Loader2 } from "lucide-react";

export type ScenarioStatus = "ready" | "running" | "error";

export function ScenarioStatusIndicator({ status }: { status: ScenarioStatus }) {
  if (status === "ready") return null;

  return (
    <div className="flex items-center gap-2">
      {status === "error" && (
        <>
          <span className="size-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold tracking-wide text-red-600 uppercase">Error</span>
        </>
      )}
      {status === "running" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">Running</span>
        </>
      )}
    </div>
  );
}
