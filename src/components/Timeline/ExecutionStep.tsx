import type { ReactNode } from "react";
import { ChevronRight, ChevronDown, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { stepConfig } from "./constants";
import { calculateRequestCost } from "@/lib/modelPricing";
import { formatCost } from "@/lib/helpers/format";
import type { ExecutionStep as ExecutionStepType, StepPhase } from "@/types";

/** `compact` = agent runtime panel. `comfortable` = run history (slightly roomier than compact). */
export type ExecutionStepVariant = "compact" | "comfortable";

interface ExecutionStepProps {
  step: ExecutionStepType;
  phase: StepPhase;
  lineProgress: number;
  isExpanded: boolean;
  isLast: boolean;
  copiedId: string | null;
  provider?: string;
  model?: string;
  onToggle: () => void;
  onCopy: () => void;
  /** When set, replaces the default icon from step type config (e.g. persisted run trace icons). */
  iconOverride?: React.ElementType;
  /** When set, replaces the default expanded body (pre + meta). */
  expandedContent?: ReactNode;
  variant?: ExecutionStepVariant;
}

export function ExecutionStep({
  step,
  phase,
  lineProgress,
  isExpanded,
  isLast,
  copiedId,
  provider,
  model,
  onToggle,
  onCopy,
  iconOverride,
  expandedContent,
  variant = "compact",
}: ExecutionStepProps) {
  const cfg = stepConfig[step.type];
  const Icon = iconOverride ?? cfg.icon;
  const badge = cfg.badge;
  const comfortable = variant === "comfortable";

  const stepCost =
    provider && model && (step.inputTokens || step.outputTokens)
      ? calculateRequestCost(provider, model, {
        inputTokens: step.inputTokens ?? 0,
        outputTokens: step.outputTokens ?? 0,
      })
      : null;

  const isErrorDone = phase === "done" && step.status === "error";

  const railW = comfortable ? 36 : 28;
  const nodeClass = comfortable ? "h-9 w-9" : "h-7 w-7";
  const glyphClass = comfortable ? "h-3.5 w-3.5" : "h-3 w-3";
  const chevronClass = comfortable ? "h-3.5 w-3.5" : "h-3 w-3";
  const segmentMin = comfortable ? 16 : 12;

  return (
    <div
      className={cn(
        // items-stretch so the rail column matches content height (incl. expanded body); connector uses flex-1 to fill.
        "group min-h-16 relative flex items-stretch cursor-pointer transition-all duration-300 rounded-md",
        comfortable
          ? "gap-3"
          : "gap-3 pl-4 pr-4 py-0",
        phase === "appearing" && "opacity-0 translate-y-1",
        phase === "processing" && "opacity-100 translate-y-0",
        phase === "done" && "opacity-100 translate-y-0"
      )}
      style={{
        transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
      }}
      onClick={onToggle}
    >
      {/* Timeline column — self-stretch + flex-1 line so the connector runs to the bottom of this row (incl. expansion). */}
      <div
        className="relative flex min-h-0 flex-shrink-0 flex-col items-center self-stretch"
        style={{ width: railW }}
      >
        <div
          className={cn(
            "relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all duration-500",
            nodeClass,
            phase === "done" &&
            !isErrorDone &&
            "bg-primary text-white shadow-glow-sm",
            phase === "done" &&
            isErrorDone &&
            "bg-red-500/10 text-red-600 border border-red-500/30",
            phase === "processing" &&
            "bg-primary/20 text-primary border border-primary/30",
            phase === "appearing" && "bg-gray-200 text-text-muted"
          )}
        >
          {phase === "processing" ? (
            <Loader2 className={cn(glyphClass, "animate-spin")} />
          ) : (
            <Icon className={glyphClass} />
          )}
        </div>

        {!isLast && phase === "done" && (
          <div
            className="relative mt-0 min-h-0 w-px flex-1 basis-0"
            style={{ minHeight: segmentMin }}
          >
            <div className="absolute inset-0 bg-gray-200 rounded-full" />
            <div
              className="absolute top-0 left-0 right-0 rounded-full bg-primary/50 transition-none"
              style={{ height: `${lineProgress * 100}%` }}
            />
          </div>
        )}
        {!isLast && phase === "processing" && (
          <div
            className="relative mt-0 min-h-0 w-px flex-1 basis-0"
            style={{ minHeight: segmentMin }}
          >
            <div className="absolute inset-0 bg-gray-100 rounded-full" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <div className={cn("flex items-center", comfortable ? "gap-2" : "gap-2")}>
          {isExpanded ? (
            <ChevronDown className={cn(chevronClass, "text-text-muted/50 flex-shrink-0")} />
          ) : (
            <ChevronRight className={cn(chevronClass, "text-text-muted/40 flex-shrink-0")} />
          )}
          <span
            className={cn(
              "truncate transition-colors duration-300",
              comfortable ? "text-sm" : "text-[12px]",
              phase === "processing"
                ? "font-medium text-text-main"
                : "font-normal text-text-main/80"
            )}
          >
            {step.label}
          </span>
          <span
            className={cn(
              "rounded-full border border-primary/15 bg-primary/5 font-medium tracking-wider text-primary/80 flex-shrink-0 uppercase",
              comfortable
                ? "px-2 py-0.5 text-[9px] leading-[18px]"
                : "px-2 py-0 text-[9px] leading-[18px]"
            )}
          >
            {badge}
          </span>

          {phase === "processing" && (
            <Loader2 className={cn(glyphClass, "text-primary/60 animate-spin flex-shrink-0")} />
          )}

          <div className="flex-1" />

          {phase === "done" && (
            <>
              {step.duration && (
                <span
                  className={cn(
                    "font-mono text-text-muted/50 flex-shrink-0",
                    comfortable ? "text-xs" : "text-[10px]"
                  )}
                >
                  {step.duration}
                </span>
              )}
              {step.tokens && (
                <span
                  className={cn(
                    "font-mono text-text-muted/40 flex-shrink-0",
                    comfortable ? "text-xs" : "text-[10px]"
                  )}
                >
                  {step.tokens}t
                </span>
              )}
              {stepCost != null && stepCost > 0 && (
                <span
                  className={cn(
                    "font-mono text-primary/70 flex-shrink-0",
                    comfortable ? "text-xs" : "text-[10px]"
                  )}
                >
                  {formatCost(stepCost)}
                </span>
              )}
              <span
                className={cn(
                  "font-mono text-text-muted/30 flex-shrink-0",
                  comfortable ? "text-xs" : "text-[10px]"
                )}
              >
                {step.timestamp}
              </span>
            </>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className={cn(
              "flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all flex-shrink-0",
              comfortable ? "h-7 w-7" : "h-5 w-5"
            )}
          >
            {copiedId === step.id ? (
              <Check className={comfortable ? "h-3 w-3 text-green-600" : "h-2.5 w-2.5 text-green-600"} />
            ) : (
              <Copy className={comfortable ? "h-3 w-3 text-text-muted/50" : "h-2.5 w-2.5 text-text-muted/50"} />
            )}
          </button>
        </div>

        {isExpanded && phase === "done" && (
          <div
            className={cn(
              "animate-in fade-in-0 duration-200",
              comfortable ? "mt-3 mb-1 ml-6" : "mt-2.5 mb-2 ml-5"
            )}
          >
            {expandedContent ?? (
              <>
                {step.meta && (
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {Object.entries(step.meta).map(([k, v]) => (
                      <span
                        key={k}
                        className={cn(
                          "rounded-full bg-gray-100 px-2 py-0.5 font-mono text-text-muted/60",
                          comfortable ? "text-[11px]" : "text-[10px]"
                        )}
                      >
                        {k}: <span className="text-text-main/70">{v}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-lg bg-gray-50 text-text-main font-mono leading-[1.7] overflow-x-auto border border-border-light custom-scrollbar",
                    comfortable ? "p-3.5 text-sm" : "p-3.5 text-[11px]"
                  )}
                >
                  <pre className="whitespace-pre-wrap break-words">{step.content}</pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
