import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepTypeBadge } from "./StepTypeBadge";
import { TokenStat } from "./TokenStat";

export interface TraceStep {
  id: string;
  type: string;
  label: string;
  icon: React.ElementType;
  status: "success" | "error";
  duration: string;
  timestamp: string;
  content: Record<string, unknown>;
}

interface TraceStepItemProps {
  step: TraceStep;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (id: string, content: unknown) => void;
  copiedId: string | null;
}

function renderStepContent(step: TraceStep): string {
  const c = step.content as Record<string, unknown>;
  if (step.type === "prompt_assembly") {
    return JSON.stringify(
      {
        model: c.model,
        temperature: c.temperature,
        max_tokens: c.max_tokens,
        messages: [
          { role: "system", content: c.system },
          ...(c.messages as object[]),
        ],
      },
      null,
      2
    );
  }
  if (step.type === "model_step" || step.type === "model_response") {
    const text = (c.chunks as string[] | undefined)?.join("") ?? "";
    const reason = c.finish_reason ? `\n\n// finish_reason: "${c.finish_reason}"` : "";
    const toolCalls = c.tool_calls as Array<{ id: string; name: string; arguments?: Record<string, unknown> }> | undefined;
    const toolCallsSection =
      toolCalls?.length
        ? `\n\n// tool_calls requested:\n${JSON.stringify(toolCalls.map((tc) => ({ id: tc.id, name: tc.name, arguments: tc.arguments ?? {} })), null, 2)}`
        : "";
    return (text + reason + toolCallsSection) || "—";
  }
  if (step.type === "tool_call") {
    return JSON.stringify(
      { tool: c.name, arguments: c.arguments ?? {} },
      null,
      2
    );
  }
  if (step.type === "tool_response") {
    const result = c.result;
    if (result === undefined || result === null) {
      return "— no result —";
    }
    return JSON.stringify(result, null, 2);
  }
  return JSON.stringify(step.content, null, 2);
}

export function TraceStepItem({ step, isExpanded, onToggle, onCopy, copiedId }: TraceStepItemProps) {
  const Icon = step.icon;
  const content = step.content as Record<string, unknown>;
  const hasUsage = "usage" in content;

  return (
    <div className="relative">
      {/* Timeline node */}
      <div
        className={cn(
          "flex items-start gap-4 cursor-pointer group",
          isExpanded && "mb-0"
        )}
        onClick={onToggle}
      >
        {/* Node dot */}
        <div
          className={cn(
            "relative z-10 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-200",
            step.status === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-500"
              : "border-red-500/30 bg-red-500/10 text-red-500",
            isExpanded && step.status === "success" && "border-green-500/60 shadow-glow-success",
            isExpanded && step.status === "error" && "border-red-500/60"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Header */}
        <div className="flex-1 flex items-center justify-between py-2.5 pr-2">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-muted" />
            )}
            <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
              {step.label}
            </span>
            <StepTypeBadge type={step.type} />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-muted">{step.timestamp}</span>
            <span className="font-mono text-xs font-medium text-text-main">+{step.duration}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(step.id, step.content);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
              title="Copy payload"
            >
              {copiedId === step.id ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-text-muted" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-[62px] mb-4">
          <div className="rounded-lg border border-border-light bg-slate-50 overflow-x-auto text-[13px] leading-6 p-4">
            <pre className="whitespace-pre-wrap break-words text-text-main">
              {renderStepContent(step)}
            </pre>
          </div>
          {hasUsage && content.usage ? (
            <div className="mt-3 flex items-center gap-4 rounded-lg border border-border-light bg-slate-50 px-4 py-2.5">
              <span className="text-[10px] font-bold tracking-widest text-text-muted">USAGE</span>
              <TokenStat
                label="Prompt"
                value={(content.usage as { prompt_tokens?: number }).prompt_tokens ?? 0}
              />
              <TokenStat
                label="Completion"
                value={(content.usage as { completion_tokens?: number }).completion_tokens ?? 0}
              />
              <TokenStat
                label="Total"
                value={(content.usage as { total_tokens?: number }).total_tokens ?? 0}
                accent
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
