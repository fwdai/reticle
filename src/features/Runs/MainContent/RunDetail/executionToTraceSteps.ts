import { FileText, Cpu, Wrench, Send } from "lucide-react";
import type { Execution } from "@/types";
import type { TraceStep } from "./Timeline";

/** Format elapsed ms as MM:SS.mmm for timeline timestamps */
function formatElapsed(ms: number): string {
  const totalSec = ms / 1000;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toFixed(3)}`;
}

/**
 * Tool call as persisted (future: from execution_tool_calls table).
 * Used to render tool_call and tool_response steps on the timeline.
 */
export interface PersistedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  /** Tool response result; absent if call failed or not yet executed */
  result?: unknown;
  /** Elapsed ms from execution start to this call */
  elapsed_ms?: number;
  /** Duration of tool execution in ms */
  duration_ms?: number;
}

/**
 * Build TraceStep[] from execution record.
 * Supports optional tool_calls for when they are persisted (separate table).
 */
export function executionToTraceSteps(
  execution: Execution,
  toolCalls?: PersistedToolCall[]
): TraceStep[] {
  const steps: TraceStep[] = [];
  const startedAt = execution.started_at ?? 0;
  const endedAt = execution.ended_at ?? startedAt;
  const totalDuration = endedAt - startedAt;

  let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  try {
    usage = execution.usage_json ? JSON.parse(execution.usage_json) : undefined;
  } catch {
    /* ignore */
  }
  const latencyMs = (usage as { latency_ms?: number })?.latency_ms ?? totalDuration;

  // 1. Prompt assembly step from input_json / snapshot_json
  let input: Record<string, unknown> = {};
  try {
    input = execution.input_json ? JSON.parse(execution.input_json) : {};
  } catch {
    /* ignore */
  }
  const config = (input.configuration as Record<string, unknown>) ?? {};
  const system = typeof input.systemPrompt === "string" ? input.systemPrompt : "";
  const userPrompt = typeof input.userPrompt === "string" ? input.userPrompt : "";
  const history = Array.isArray(input.history) ? input.history : [];
  const historyMessages = history.filter(
    (m): m is { role: string; content: string } =>
      m && typeof m === "object" && typeof (m as { role?: string }).role === "string" && typeof (m as { content?: string }).content === "string"
  );
  // Chronological order: prior turns + current user prompt
  const messages = [...historyMessages, { role: "user" as const, content: userPrompt }];
  const model = typeof config.model === "string" ? config.model : "—";
  const temperature = typeof config.temperature === "number" ? config.temperature : 0.7;
  const maxTokens = typeof config.maxTokens === "number" ? config.maxTokens : 2048;

  steps.push({
    id: "prompt_assembly",
    type: "prompt_assembly",
    label: "Prompt Assembled",
    icon: FileText,
    status: execution.status === "succeeded" || execution.status === "failed" ? "success" : "success",
    duration: "0ms",
    timestamp: formatElapsed(0),
    content: {
      system,
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
    },
  });

  // 2. Tool calls (if persisted) - interleave tool_call and tool_response
  // These render between prompt and final model response
  const toolCallsList = Array.isArray(toolCalls) ? toolCalls : [];
  for (let i = 0; i < toolCallsList.length; i++) {
    const tc = toolCallsList[i];
    const elapsed = tc.elapsed_ms ?? 0;
    const duration = tc.duration_ms ?? 0;

    steps.push({
      id: `tool_call_${tc.id}`,
      type: "tool_call",
      label: `Tool Call → ${tc.name}`,
      icon: Wrench,
      status: "success",
      duration: `${duration}ms`,
      timestamp: formatElapsed(elapsed),
      content: { name: tc.name, arguments: tc.arguments },
    });

    steps.push({
      id: `tool_response_${tc.id}`,
      type: "tool_response",
      label: `Tool Response ← ${tc.name}`,
      icon: Send,
      status: "success",
      duration: `${duration}ms`,
      timestamp: formatElapsed(elapsed),
      content: { result: tc.result },
    });
  }

  // 3. Model response step from result_json (final response)
  let result: { text?: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } } = {};
  try {
    result = execution.result_json ? JSON.parse(execution.result_json) : {};
  } catch {
    /* ignore */
  }
  const text = typeof result.text === "string" ? result.text : "";
  const resultUsage = (result.usage ?? usage) as Record<string, unknown> | undefined;
  const promptTokens =
    Number(resultUsage?.inputTokens ?? resultUsage?.input_tokens) || 0;
  const completionTokens =
    Number(resultUsage?.outputTokens ?? resultUsage?.output_tokens) || 0;
  const totalTokens =
    Number(resultUsage?.totalTokens ?? resultUsage?.total_tokens) || promptTokens + completionTokens;

  const finishReason = toolCallsList.length > 0 ? "tool_calls" : "stop";

  steps.push({
    id: "model_response",
    type: "model_response",
    label: toolCallsList.length > 0 ? "Final Model Response" : "Model Response",
    icon: Cpu,
    status: execution.status === "succeeded" ? "success" : "error",
    duration: `${Math.round(latencyMs)}ms`,
    timestamp: formatElapsed(toolCallsList.length > 0 ? totalDuration - latencyMs : 0),
    content: {
      chunks: text ? [text] : [],
      finish_reason: finishReason,
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens },
    },
  });

  return steps;
}
