import { TraceStepItem, type TraceStep } from "./TraceStepItem";

export type { TraceStep };

interface TimelineProps {
  traceSteps: TraceStep[];
  expandedSteps: Set<string>;
  onToggleStep: (id: string) => void;
  onCopyContent: (id: string, content: unknown) => void;
  copiedId: string | null;
}

export function Timeline({
  traceSteps,
  expandedSteps,
  onToggleStep,
  onCopyContent,
  copiedId,
}: TimelineProps) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Vertical gap between steps is pb-3 on each ExecutionStep (comfortable) so the rail line runs through it */}
      {traceSteps.map((step, idx) => (
        <TraceStepItem
          key={step.id}
          step={step}
          isExpanded={expandedSteps.has(step.id)}
          isLast={idx === traceSteps.length - 1}
          onToggle={() => onToggleStep(step.id)}
          onCopy={onCopyContent}
          copiedId={copiedId}
        />
      ))}
    </div>
  );
}
