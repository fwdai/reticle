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
    <div className="relative max-w-4xl mx-auto">
      {/* Timeline line */}
      <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border-light" />

      <div className="space-y-1">
        {traceSteps.map((step) => (
          <TraceStepItem
            key={step.id}
            step={step}
            isExpanded={expandedSteps.has(step.id)}
            onToggle={() => onToggleStep(step.id)}
            onCopy={onCopyContent}
            copiedId={copiedId}
          />
        ))}
      </div>
    </div>
  );
}
