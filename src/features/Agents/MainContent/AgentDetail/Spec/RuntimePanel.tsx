export type ExecutionStatus = "idle" | "running" | "success" | "error";

interface RuntimePanelProps {
  status?: ExecutionStatus;
  elapsedSeconds?: number;
  tokens?: number;
  cost?: number;
}

function formatDuration(seconds?: number) {
  if (seconds == null || seconds === 0) return "-";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatTokens(tokens?: number) {
  if (tokens == null || tokens === 0) return "-";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k tokens`;
  return `${tokens} tokens`;
}

function formatCost(cost?: number) {
  if (cost == null || cost === 0) return "-";
  return `$${cost.toFixed(4)}`;
}

export function RuntimePanel({
  status = "idle",
  elapsedSeconds,
  tokens,
  cost,
}: RuntimePanelProps) {
  const statusConfig = {
    idle: {
      color: "bg-gray-400",
      label: "Idle",
      pulse: false,
    },
    running: {
      color: "bg-primary",
      label: "Running",
      pulse: true,
    },
    success: {
      color: "bg-green-500",
      label: "Success",
      pulse: false,
    },
    error: {
      color: "bg-red-500",
      label: "Error",
      pulse: false,
    },
  } satisfies Record<
    ExecutionStatus,
    { color: string; label: string; pulse: boolean }
  >;

  const config = statusConfig[status];

  return (
    <section className="h-full flex flex-col overflow-hidden rounded-b-xl">
      <div className="h-11 flex-shrink-0 border-b border-border-light flex items-center justify-between px-6 bg-sidebar-light/40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 ${config.color} rounded-full ${config.pulse ? "animate-pulse-subtle" : ""}`}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">
              Agent Execution
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Status
              </span>
              <span
                className={`text-[11px] font-bold leading-none uppercase ${
                  status === "error"
                    ? "text-red-600"
                    : status === "idle"
                      ? "text-text-muted"
                      : status === "running"
                        ? "text-primary"
                        : "text-green-600"
                }`}
              >
                {config.label}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Duration
              </span>
              <span className="text-[11px] font-bold text-text-main leading-none">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Tokens
              </span>
              <span className="text-[11px] font-bold text-text-main leading-none">
                {formatTokens(tokens)}
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Cost
              </span>
              <span className="text-[11px] font-bold text-text-main leading-none">
                {formatCost(cost)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 custom-scrollbar bg-white text-sm text-text-main rounded-b-xl">
        <div className="space-y-5">
          <div>
            <h4 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase mb-3">
              Scratchpad
            </h4>
            <div className="rounded-lg border border-border-light bg-white p-3 min-h-[80px]">
              <p className="text-[11px] text-text-muted/60 italic">
                Internal reasoning will appear here during runs...
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase mb-3">
              Conversation State
            </h4>
            <div className="rounded-lg border border-border-light bg-white p-3 min-h-[60px]">
              <p className="text-[11px] text-text-muted/60 italic">
                No messages yet. Run the agent to see conversation state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
