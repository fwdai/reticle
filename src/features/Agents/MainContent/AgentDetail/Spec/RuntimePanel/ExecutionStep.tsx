import { ChevronRight, ChevronDown, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { stepConfig } from "./constants";
import type { ExecutionStep as ExecutionStepType, StepPhase } from "./types";

interface ExecutionStepProps {
  step: ExecutionStepType;
  phase: StepPhase;
  lineProgress: number;
  isExpanded: boolean;
  isLast: boolean;
  copiedId: string | null;
  onToggle: () => void;
  onCopy: () => void;
}

export function ExecutionStep({
  step,
  phase,
  lineProgress,
  isExpanded,
  isLast,
  copiedId,
  onToggle,
  onCopy,
}: ExecutionStepProps) {
  const cfg = stepConfig[step.type];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 pl-4 pr-4 cursor-pointer transition-all duration-300 rounded-md mx-1",
        "hover:bg-gray-50",
        isExpanded && "bg-gray-50/80",
        phase === "appearing" && "opacity-0 translate-y-1",
        phase === "processing" && "opacity-100 translate-y-0",
        phase === "done" && "opacity-100 translate-y-0"
      )}
      style={{
        transition:
          "opacity 0.4s ease-out, transform 0.4s ease-out, background-color 0.2s",
      }}
      onClick={onToggle}
    >
      {/* Timeline column */}
      <div
        className="relative flex flex-col items-center flex-shrink-0"
        style={{ width: 28 }}
      >
        <div
          className={cn(
            "relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500",
            phase === "done" && "bg-primary text-white shadow-glow-sm",
            phase === "processing" &&
              "bg-primary/20 text-primary border border-primary/30",
            phase === "appearing" && "bg-gray-200 text-text-muted"
          )}
        >
          {phase === "processing" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Icon className="h-3 w-3" />
          )}
        </div>

        {!isLast && phase === "done" && (
          <div
            className="relative w-px mt-0 flex-1"
            style={{ minHeight: isExpanded ? 12 : 12 }}
          >
            <div className="absolute inset-0 bg-gray-200 rounded-full" />
            <div
              className="absolute top-0 left-0 right-0 rounded-full bg-primary/50 transition-none"
              style={{ height: `${lineProgress * 100}%` }}
            />
          </div>
        )}
        {!isLast && phase === "processing" && (
          <div className="relative w-px mt-0 flex-1" style={{ minHeight: 12 }}>
            <div className="absolute inset-0 bg-gray-100 rounded-full" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-text-muted/50 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-text-muted/40 flex-shrink-0" />
          )}
          <span
            className={cn(
              "text-[12px] truncate transition-colors duration-300",
              phase === "processing"
                ? "font-medium text-text-main"
                : "font-normal text-text-main/80"
            )}
          >
            {step.label}
          </span>
          <span className="rounded-full border border-primary/15 bg-primary/5 px-2 py-0 text-[9px] font-medium tracking-wider text-primary/80 flex-shrink-0 leading-[18px] uppercase">
            {cfg.badge}
          </span>

          {phase === "processing" && (
            <Loader2 className="h-3 w-3 text-primary/60 animate-spin flex-shrink-0" />
          )}

          <div className="flex-1" />

          {phase === "done" && (
            <>
              {step.duration && (
                <span className="font-mono text-[10px] text-text-muted/50 flex-shrink-0">
                  {step.duration}
                </span>
              )}
              {step.tokens && (
                <span className="font-mono text-[10px] text-text-muted/40 flex-shrink-0">
                  {step.tokens}t
                </span>
              )}
              {step.cost && (
                <span className="font-mono text-[10px] text-primary/70 flex-shrink-0">
                  {step.cost}
                </span>
              )}
              <span className="font-mono text-[10px] text-text-muted/30 flex-shrink-0">
                {step.timestamp}
              </span>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="flex h-5 w-5 items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all flex-shrink-0"
          >
            {copiedId === step.id ? (
              <Check className="h-2.5 w-2.5 text-green-600" />
            ) : (
              <Copy className="h-2.5 w-2.5 text-text-muted/50" />
            )}
          </button>
        </div>

        {isExpanded && phase === "done" && (
          <div className="mt-2.5 mb-2 ml-5 animate-in fade-in-0 duration-200">
            {step.meta && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {Object.entries(step.meta).map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-text-muted/60"
                  >
                    {k}: <span className="text-text-main/70">{v}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="rounded-lg bg-gray-50 text-text-main p-3.5 font-mono text-[11px] leading-[1.7] overflow-x-auto border border-border-light custom-scrollbar">
              <pre className="whitespace-pre-wrap break-words">{step.content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
