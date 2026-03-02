import { forwardRef } from "react";
import { Zap } from "lucide-react";
import { filterOptions } from "./constants";
import { ExecutionStep as ExecutionStepItem } from "./ExecutionStep";
import type { AgentExecutionStatus, ExecutionStep, StepPhase, StepType } from "@/types";
import { cn } from "@/lib/utils";

interface ExecutionTimelineProps {
  status: AgentExecutionStatus;
  steps: ExecutionStep[];
  filter: StepType | "all";
  onFilterChange: (filter: StepType | "all") => void;
  expandedSteps: Set<string>;
  onToggleStep: (id: string) => void;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
  stepPhases: Map<string, StepPhase>;
  lineProgress: Map<string, number>;
  hasPrompt?: boolean;
  provider?: string;
  model?: string;
}

export const ExecutionTimeline = forwardRef<
  HTMLDivElement,
  ExecutionTimelineProps
>(function ExecutionTimeline(
  {
    status,
    steps,
    filter,
    onFilterChange,
    expandedSteps,
    onToggleStep,
    copiedId,
    onCopy,
    stepPhases,
    lineProgress,
    hasPrompt,
    provider,
    model,
  },
  ref
) {
  const filteredSteps =
    filter === "all" ? steps : steps.filter((s) => s.type === filter);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters */}
      <div className="flex items-center gap-1 px-4 py-1.5 flex-shrink-0 border-b border-border-light">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide transition-all duration-200",
              filter === f.value
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-text-muted/60 hover:text-text-muted hover:bg-gray-100 border border-transparent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline content */}
      <div
        ref={ref}
        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white"
      >
        {status === "idle" ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3 bg-gray-50 border border-border-light">
              <Zap className="h-5 w-5 text-text-muted/40" />
            </div>
            <p className="text-[11px] text-text-muted/60 mb-1">No execution yet</p>
            <p className="text-[10px] text-text-muted/50">
              {hasPrompt
                ? "Enter a task above and hit Enter"
                : "Run the agent to see execution trace"}
            </p>
          </div>
        ) : (
          <div className="py-3">
            {filteredSteps.map((step, idx) => {
              const phase = stepPhases.get(step.id) || "hidden";
              const lp = lineProgress.get(step.id) || 0;
              const isExpanded = expandedSteps.has(step.id);
              const isLast = idx === filteredSteps.length - 1;
              const showLoopDivider =
                idx > 0 && step.loop !== filteredSteps[idx - 1]?.loop;

              if (phase === "hidden") return null;

              return (
                <div key={step.id}>
                  {showLoopDivider && (
                    <div className="flex items-center gap-3 px-5 py-1.5 animate-in fade-in-0 duration-200">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      <span className="text-[9px] font-medium tracking-[0.2em] text-text-muted/50 uppercase">
                        Loop {step.loop}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                  )}

                  <ExecutionStepItem
                    step={step}
                    phase={phase}
                    lineProgress={lp}
                    isExpanded={isExpanded}
                    isLast={isLast}
                    copiedId={copiedId}
                    provider={provider}
                    model={model}
                    onToggle={() => onToggleStep(step.id)}
                    onCopy={() => onCopy(step.id, step.content)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
