import { Loader2 } from "lucide-react";
import type { AgentStatus } from "./types";

export function StatusIndicator({ status }: { status: AgentStatus }) {
  return (
    <div className="flex items-center gap-2">
      {status === "ready" && (
        <>
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-semibold tracking-wide text-green-600 uppercase">Ready</span>
        </>
      )}
      {status === "needs-config" && (
        <>
          <span className="size-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-semibold tracking-wide text-amber-600 uppercase">Needs config</span>
        </>
      )}
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
