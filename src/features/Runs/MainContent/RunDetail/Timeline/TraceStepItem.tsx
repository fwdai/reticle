import type { ExecutionStep as ExecutionStepType, StepType } from "@/types";
import { ExecutionStep } from "@/components/Timeline/ExecutionStep";
import { stepConfig } from "@/components/Timeline/constants";
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
  isLast: boolean;
  onToggle: () => void;
  onCopy: (id: string, content: unknown) => void;
  copiedId: string | null;
  /** From execution snapshot — enables per-step cost in the timeline */
  provider?: string;
  model?: string;
}

const TRACE_TYPE_MAP: Record<string, StepType> = {
  prompt_assembly: "task_input",
  model_step: "model_call",
};

function traceTypeToStepType(type: string): StepType {
  if (Object.prototype.hasOwnProperty.call(stepConfig, type)) {
    return type as StepType;
  }
  return TRACE_TYPE_MAP[type] ?? "model_call";
}

function isLlmMappedType(mapped: StepType): boolean {
  return mapped === "model_call" || mapped === "model_response" || mapped === "reasoning";
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
    const toolCalls = c.tool_calls as
      | Array<{ id: string; name: string; arguments?: Record<string, unknown> }>
      | undefined;
    const toolCallsSection = toolCalls?.length
      ? `\n\n// tool_calls requested:\n${JSON.stringify(
        toolCalls.map((tc) => ({ id: tc.id, name: tc.name, arguments: tc.arguments ?? {} })),
        null,
        2
      )}`
      : "";
    return (text + reason + toolCallsSection) || "—";
  }
  if (step.type === "tool_call") {
    return JSON.stringify({ tool: c.name, arguments: c.arguments ?? {} }, null, 2);
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

export function TraceStepItem({
  step,
  isExpanded,
  isLast,
  onToggle,
  onCopy,
  copiedId,
  provider,
  model,
}: TraceStepItemProps) {
  const content = step.content as Record<string, unknown>;
  const hasUsage = "usage" in content;
  const mappedType = traceTypeToStepType(step.type);
  const isLlm = isLlmMappedType(mappedType);

  const usage = content.usage as
    | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    | undefined;

  let tokens: number | undefined;
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  if (isLlm && usage) {
    const pt = Number(usage.prompt_tokens ?? 0);
    const ct = Number(usage.completion_tokens ?? 0);
    const tt = Number(usage.total_tokens ?? 0) || pt + ct;
    if (tt > 0) tokens = tt;
    if (pt > 0) inputTokens = pt;
    if (ct > 0) outputTokens = ct;
  }

  /** Older traces stored token totals in `duration` ("566 tokens"); strip that so the row uses tokens + cost + duration */
  let durationLabel = step.duration;
  if (isLlm && /^\d+\s*tokens$/.test(durationLabel.trim())) {
    durationLabel = "—";
  }

  const executionStep: ExecutionStepType = {
    id: step.id,
    type: mappedType,
    label: step.label,
    status: step.status === "error" ? "error" : "success",
    timestamp: step.timestamp,
    duration: durationLabel,
    tokens,
    inputTokens,
    outputTokens,
    content: "",
  };

  return (
    <ExecutionStep
      step={executionStep}
      phase="done"
      lineProgress={1}
      isExpanded={isExpanded}
      isLast={isLast}
      copiedId={copiedId}
      iconOverride={step.icon}
      variant="comfortable"
      provider={provider}
      model={model}
      onToggle={onToggle}
      onCopy={() => onCopy(step.id, step.content)}
      expandedContent={
        <>
          <div className="rounded-lg bg-gray-50 text-text-main p-3.5 font-mono text-xs leading-[1.7] overflow-x-auto border border-border-light custom-scrollbar">
            <pre className="whitespace-pre-wrap break-words">{renderStepContent(step)}</pre>
          </div>
          {hasUsage && content.usage ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border-light bg-gray-50 px-3.5 py-2.5">
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
        </>
      }
    />
  );
}
