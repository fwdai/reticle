import { getProviderForModel } from "@/lib/modelManager";
import type { FlowCanvasProps } from "@/features/Scenarios/MainContent/Visualizer/FlowCanvas";
import type { Execution } from "@/types";
import type { RunDetailRun } from "./types";
import type { PersistedToolCall } from "./executionToTraceSteps";

/**
 * Build FlowCanvasProps from execution record.
 * Uses input_json for input settings and result_json for output.
 * Resolves provider via modelManager cache lookup.
 */
export async function executionToFlowCanvasProps(execution: Execution, run: RunDetailRun): Promise<FlowCanvasProps> {
  let input: Record<string, unknown> = {};
  try {
    input = execution.input_json ? JSON.parse(execution.input_json) : {};
  } catch {
    /* ignore */
  }

  const config = (input.configuration as Record<string, unknown>) ?? {};
  const systemPrompt = typeof input.systemPrompt === "string" ? input.systemPrompt : "";
  const userPrompt = typeof input.userPrompt === "string" ? input.userPrompt : "";
  const rawHistory = Array.isArray(input.history) ? input.history : [];
  const history = rawHistory.filter(
    (m): m is { role: "user" | "assistant"; content: string } =>
      m &&
      typeof m === "object" &&
      ((m as { role?: string }).role === "user" || (m as { role?: string }).role === "assistant") &&
      typeof (m as { content?: string }).content === "string"
  );

  const model = typeof config.model === "string" ? config.model : run.model;
  const provider = await getProviderForModel(model);
  const temperature = typeof config.temperature === "number" ? config.temperature : 0.7;
  const maxTokens = typeof config.maxTokens === "number" ? config.maxTokens : 2048;

  let result: { text?: string; usage?: Record<string, unknown> } = {};
  try {
    result = execution.result_json ? JSON.parse(execution.result_json) : {};
  } catch {
    /* ignore */
  }

  const text = typeof result.text === "string" ? result.text : "";
  const resultUsage = result.usage as {
    inputTokens?: number;
    input_tokens?: number;
    outputTokens?: number;
    output_tokens?: number;
    totalTokens?: number;
    total_tokens?: number;
  } | undefined;
  const promptTokens = Number(resultUsage?.inputTokens ?? resultUsage?.input_tokens) || 0;
  const completionTokens = Number(resultUsage?.outputTokens ?? resultUsage?.output_tokens) || 0;
  const totalTokens = Number(resultUsage?.totalTokens ?? resultUsage?.total_tokens) || promptTokens + completionTokens;

  const startedAt = execution.started_at ?? 0;
  const endedAt = execution.ended_at ?? startedAt;
  const latencyMs = endedAt - startedAt;

  const response =
    execution.status === "succeeded" || execution.status === "failed"
      ? {
          text,
          usage: { promptTokens, completionTokens, totalTokens },
          latency: latencyMs,
          error: run.status === "error" ? "Run failed" : undefined,
        }
      : null;

  let executionToolCalls: PersistedToolCall[] | undefined;
  try {
    if (execution.tool_calls_json) {
      executionToolCalls = JSON.parse(execution.tool_calls_json) as PersistedToolCall[];
    }
  } catch {
    /* ignore */
  }

  return {
    systemPrompt,
    userPrompt,
    attachments: [],
    tools: [],
    configuration: { provider, model, temperature, topP: 1, maxTokens },
    history,
    response,
    providerModels: {},
    executionToolCalls,
  };
}
