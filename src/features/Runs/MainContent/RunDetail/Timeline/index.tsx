import { TraceStepItem, type TraceStep } from "./TraceStepItem";

export type { TraceStep };

interface TimelineProps {
  traceSteps: TraceStep[];
  expandedSteps: Set<string>;
  onToggleStep: (id: string) => void;
  onCopyContent: (id: string, content: unknown) => void;
  copiedId: string | null;
  provider?: string;
  model?: string;
}

export function Timeline({
  traceSteps,
  expandedSteps,
  onToggleStep,
  onCopyContent,
  copiedId,
  provider,
  model,
}: TimelineProps) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {traceSteps.map((step, idx) => (
        <TraceStepItem
          key={step.id}
          step={step}
          isExpanded={expandedSteps.has(step.id)}
          isLast={idx === traceSteps.length - 1}
          onToggle={() => onToggleStep(step.id)}
          onCopy={onCopyContent}
          copiedId={copiedId}
          provider={provider}
          model={model}
        />
      ))}
    </div>
  );
}
