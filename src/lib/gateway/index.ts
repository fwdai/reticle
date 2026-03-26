import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText as streamTextAi, stepCountIs, type ModelMessage } from 'ai';

import { GatewayFetch } from './GatewayFetch';
import {
  GATEWAY_URL,
  API_KEY,
  STEPS_COUNT,
  GATEWAY_NAME,
} from './constants';
import {
  getProviderHeaders,
  isReasoningModel,
  loadAttachmentsAsContentParts,
  toolConfigToAiSdkTools,
} from './helpers';
import { LLMCallConfig } from '@/types';
import type { AttachedFile } from '@/contexts/StudioContext';
import type { Tool } from '@/components/Tools/types';
import { listEnvVariables } from '@/lib/storage';
import type {
  PersistedToolCall,
  PersistedModelStep,
} from '@/features/Runs/MainContent/RunDetail/executionToTraceSteps';

/** Extract model steps and tool calls from AI SDK steps. Exported for use with streamText result. */
export function extractStepsAndToolCalls(
  steps: Array<{
    text: string;
    finishReason: string;
    usage?: { promptTokens?: number; outputTokens?: number; totalTokens?: number; inputTokens?: number };
    toolCalls: Array<{ toolCallId: string; toolName: string; input: unknown }>;
    toolResults: Array<{ toolCallId: string; output: unknown }>;
  }>
): { modelSteps: PersistedModelStep[]; toolCalls: PersistedToolCall[] } {
  const modelSteps: PersistedModelStep[] = [];
  const toolCalls: PersistedToolCall[] = [];
  let elapsedMs = 0;

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const step = steps[stepIndex];
    const usage = step.usage as { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined;
    const promptTokens = Number(usage?.inputTokens) || 0;
    const completionTokens = Number(usage?.outputTokens) || 0;
    const totalTokens = Number(usage?.totalTokens) || promptTokens + completionTokens;

    const stepToolCalls =
      step.toolCalls?.map((tc) => ({
        id: tc.toolCallId,
        name: tc.toolName,
        arguments: (tc.input as Record<string, unknown>) ?? {},
      })) ?? [];
    modelSteps.push({
      stepIndex,
      text: step.text ?? '',
      finishReason: step.finishReason ?? 'unknown',
      usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens },
      ...(stepToolCalls.length > 0 ? { toolCalls: stepToolCalls } : {}),
    });

    const resultsById = new Map((step.toolResults ?? []).map((r) => [r.toolCallId, r]));
    for (const tc of step.toolCalls ?? []) {
      const tr = resultsById.get(tc.toolCallId);
      toolCalls.push({
        id: tc.toolCallId,
        name: tc.toolName,
        arguments: (tc.input as Record<string, unknown>) ?? {},
        stepIndex,
        result: tr?.output,
        elapsed_ms: elapsedMs,
      });
    }
    elapsedMs += 100;
  }

  return { modelSteps, toolCalls };
}

// Providers whose OpenAI-compatible endpoint lives at a non-/v1 path.
// The proxy forwards: target_url_base (from X-Proxy-Target-Url) + incoming path.
// Setting a different gateway base here changes which path reaches the provider.
const PROVIDER_GATEWAY_BASE: Partial<Record<string, string>> = {
  google: 'http://localhost:11513/v1beta/openai',
};

export const createModel = (
  config: Pick<LLMCallConfig, 'provider' | 'model'>,
  gateway?: GatewayFetch
) => {
  const { provider, model } = config;
  const gatewayBase = PROVIDER_GATEWAY_BASE[provider] ?? GATEWAY_URL;

  return createOpenAICompatible({
    name: GATEWAY_NAME,
    apiKey: API_KEY,
    baseURL: gatewayBase,
    includeUsage: true, // Important: must match original
    headers: getProviderHeaders(provider),
    fetch: gateway?.fetch ?? fetch, // Use latency-measuring fetch when gateway provided
    // OpenAI reasoning models require max_completion_tokens instead of max_tokens.
    // This is a workaround to support the OpenAI API for reasoning models as @ai-sdk/openai-compatible doesn't handle this.
    transformRequestBody: (args) => {
      if (provider === 'openai' && isReasoningModel(args.model ?? '')) {
        if (args.max_tokens != null) {
          args.max_completion_tokens = args.max_tokens;
          delete args.max_tokens;
        }
      }
      return args;
    },
  })(model);
}

export const streamText = async (
  userPrompt: string,
  systemPrompt: string,
  history: ModelMessage[],
  config: LLMCallConfig,
  tools?: Tool[],
  attachments?: AttachedFile[],
  abortSignal?: AbortSignal
) => {
  const gateway = new GatewayFetch();

  const messages: ModelMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // Add previous messages from history
  messages.push(...history);

  // Build user message: text + optional file/image parts
  let userContent: string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mediaType?: string } | { type: 'file'; data: string; mediaType: string; filename?: string }>;
  if (attachments?.length) {
    const fileParts = await loadAttachmentsAsContentParts(attachments);
    userContent = fileParts.length
      ? [{ type: 'text', text: userPrompt }, ...fileParts]
      : userPrompt;
  } else {
    userContent = userPrompt;
  }
  messages.push({ role: 'user', content: userContent });

  const rawEnvVars = tools?.length ? await listEnvVariables() : [];
  const envVarsMap = Object.fromEntries(rawEnvVars.map(v => [v.key, v.value]));
  const aiTools = tools?.length ? toolConfigToAiSdkTools(tools, envVarsMap) : undefined;

  const result = await streamTextAi({
    model: createModel(config, gateway),
    messages: messages,
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
    ...(aiTools ? { tools: aiTools } : {}),
    ...(aiTools ? { stopWhen: stepCountIs(STEPS_COUNT) } : {}),
    ...(abortSignal ? { abortSignal } : {}),
  });

  const latency = gateway.getLatency();

  return Object.assign(result, { latency: latency ?? undefined });
};

// Providers whose models list lives outside the standard /v1/models path.
const PROVIDER_MODELS_URL: Partial<Record<string, string>> = {
  google: 'http://localhost:11513/v1beta/openai/models',
};

export const listModels = async (providerId: string): Promise<any[]> => {
  const modelsUrl = PROVIDER_MODELS_URL[providerId] ?? `${GATEWAY_URL}/models`;
  try {
    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: getProviderHeaders(providerId),
    });

    if (!response.ok) {
      console.log(response)
      const errorText = await response.text();
      throw new Error(`Failed to fetch models from ${providerId}: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // Return the array as returned from the API
    if (data && Array.isArray(data.data)) {
      return data.data;
    } else if (data && Array.isArray(data.models)) {
      return data.models;
    } else if (Array.isArray(data)) {
      return data;
    }

    throw new Error(`Unexpected response format from ${providerId} models API.`);

  } catch (error) {
    console.error(`Error listing models for ${providerId}:`, error);
    throw error;
  }
}