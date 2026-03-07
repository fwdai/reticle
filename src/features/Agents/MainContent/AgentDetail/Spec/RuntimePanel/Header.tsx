import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import Cost from "@/components/Cost";
import { formatDuration } from "@/lib/helpers/time";
import { formatTokens } from "@/lib/helpers/format";
import type { AgentExecutionStatus } from "@/types";
import { useAgentContext } from "@/contexts/AgentContext";

interface HeaderProps {
  status: AgentExecutionStatus;
  elapsedSeconds?: number;
  tokens?: number;
  totalTokens: number;
  totalLoops: number;
  stepCount: number;
  showRuns: boolean;
  onToggleRuns: () => void;
}

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
  cancelled: {
    color: "bg-amber-500",
    label: "Cancelled",
    pulse: false,
  },
} satisfies Record<AgentExecutionStatus, { color: string; label: string; pulse: boolean }>;

export function Header({
  status,
  elapsedSeconds,
  tokens,
  totalTokens,
  totalLoops,
  stepCount,
  showRuns,
  onToggleRuns,
}: HeaderProps) {
  const config = statusConfig[status];
  const { execution } = useAgentContext();
  const inputTokens = execution.steps.reduce((a, s) => a + (s.inputTokens || 0), 0);
  const outputTokens = execution.steps.reduce((a, s) => a + (s.outputTokens || 0), 0);

  return (
    <div className="h-11 flex-shrink-0 border-b border-border-light flex items-center justify-between px-6 bg-sidebar-light/40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              config.color,
              config.pulse && "animate-pulse-subtle"
            )}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">
            Agent Execution
          </span>
          {status === "running" && (
            <span className="text-[10px] font-mono text-primary animate-pulse-subtle">
              live
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
              Status
            </span>
            <span
              className={cn(
                "text-[11px] font-bold leading-none uppercase",
                status === "error" && "text-red-600",
                status === "cancelled" && "text-amber-600",
                status === "idle" && "text-text-muted",
                status === "running" && "text-primary",
                status === "success" && "text-green-600"
              )}
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
              {formatDuration(elapsedSeconds != null ? elapsedSeconds * 1000 : undefined)}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
              Tokens
            </span>
            <span className="text-[11px] font-bold text-text-main leading-none">
              {tokens != null ? formatTokens(tokens) : totalTokens.toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <Cost provider={execution.provider} model={execution.model} inputTokens={inputTokens} outputTokens={outputTokens} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-text-muted/60">
          {totalLoops} loops · {stepCount} steps
        </span>
        <button
          onClick={onToggleRuns}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors",
            showRuns
              ? "bg-primary/10 text-primary"
              : "text-text-muted hover:text-text-main hover:bg-gray-100"
          )}
        >
          <History className="size-3" />
          Runs
        </button>
      </div>
    </div>
  );
}
