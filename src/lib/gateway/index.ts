import { invoke } from '@tauri-apps/api/core';
import { PROVIDERS_LIST } from '@/constants/providers';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  generateText as generateTextAi,
  jsonSchema,
  tool,
  type ModelMessage,
  type ToolSet,
} from 'ai';

import { GatewayFetch } from './GatewayFetch';
import { LLMCallConfig } from '@/types';
import type { AttachedFile } from '@/contexts/StudioContext';
import type { Tool } from '@/features/Studio/MainContent/Editor/Main/Tools/types';

const GATEWAY_URL = 'http://localhost:11513/v1';
const API_KEY = '1';

/** OpenAI reasoning models require max_completion_tokens instead of max_tokens. */
const REASONING_MODEL_PREFIXES = [
  'o1',
  'o3',
  'o4-mini',
  'codex-mini',
  'computer-use-preview',
  'gpt-5',
];

const getProviderHeaders = (providerId: string) => {
  const providerConfig = PROVIDERS_LIST.find(p => p.id === providerId);

  if (!providerConfig) {
    throw new Error(`Provider "${providerId}" not found.`);
  }
  const headers: HeadersInit = {
    'X-Api-Provider': providerConfig.id,
    'X-Api-Auth-Header': providerConfig.header,
    'X-Proxy-Target-Url': providerConfig.baseUrl,
  };

  if (providerId === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01'; // Required for Anthropic API
  }
  return headers;
}

function isReasoningModel(modelId: string): boolean {
  if (modelId.startsWith('gpt-5-chat')) return false;
  return REASONING_MODEL_PREFIXES.some((p) => modelId.startsWith(p));
}

const createModel = (config: LLMCallConfig, gateway: GatewayFetch) => {
  const { provider, model } = config;

  return createOpenAICompatible({
    name: 'reticle',
    apiKey: API_KEY,
    baseURL: GATEWAY_URL,
    includeUsage: true, // Important: must match original
    headers: getProviderHeaders(provider),
    fetch: gateway.fetch, // Use our latency-measuring fetch
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

/** Load attachment blobs and build content parts for the user message. */
async function loadAttachmentsAsContentParts(
  attachments: AttachedFile[]
): Promise<Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mediaType?: string } | { type: 'file'; data: string; mediaType: string; filename?: string }>> {
  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: string; mediaType?: string }
    | { type: 'file'; data: string; mediaType: string; filename?: string }
  > = [];
  for (const att of attachments) {
    if (!att.path) continue;
    try {
      const base64 = await invoke<string>('read_attachment_blob', { blobPath: att.path });
      const mediaType = att.type || 'application/octet-stream';
      const dataUrl = `data:${mediaType};base64,${base64}`;
      if (mediaType.startsWith('image/')) {
        parts.push({ type: 'image', image: dataUrl, mediaType });
      } else {
        parts.push({ type: 'file', data: dataUrl, mediaType, filename: att.name });
      }
    } catch (err) {
      console.warn(`Failed to load attachment ${att.name}:`, err);
    }
  }
  return parts;
}

/** Convert scenario tools to AI SDK tool format. Uses mockResponse for execute. */
function scenarioToolsToAiSdkTools(tools: Tool[]): ToolSet {
  const result: ToolSet = {};
  for (const t of tools) {
    const properties: Record<string, { type: 'string' | 'number' | 'boolean' | 'object' | 'array'; description?: string }> = {};
    const required: string[] = [];
    for (const p of t.parameters) {
      properties[p.name] = {
        type: p.type,
        ...(p.description ? { description: p.description } : {}),
      };
      if (p.required) required.push(p.name);
    }
    const mockResponse = t.mockResponse;
    const mockMode = t.mockMode ?? 'json';
    result[t.name] = tool({
      description: t.description,
      inputSchema: jsonSchema({
        type: 'object',
        properties: Object.keys(properties).length ? properties : {},
        required,
        additionalProperties: false,
      }),
      execute: async () => {
        if (mockMode === 'json') {
          try {
            return JSON.parse(mockResponse);
          } catch {
            return mockResponse;
          }
        }
        return mockResponse;
      },
    });
  }
  return result;
}

export const generateText = async (
  userPrompt: string,
  systemPrompt: string,
  history: ModelMessage[],
  config: LLMCallConfig,
  tools?: Tool[],
  attachments?: AttachedFile[]
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

  const aiTools = tools?.length ? scenarioToolsToAiSdkTools(tools) : undefined;

  const result = await generateTextAi({
    model: createModel(config, gateway),
    messages: messages,
    temperature: config.temperature,
    topP: config.topP,
    maxOutputTokens: config.maxTokens,
    ...(aiTools ? { tools: aiTools } : {}),
  });

  // Get the measured latency
  const latency = gateway.getLatency();

  // Map the result properties: generateTextAi returns output and totalUsage,
  // but we need to map them to text and usage for consistency
  return {
    ...result,
    text: result.output ?? result.text, // Use output if available, fallback to text
    usage: result.totalUsage ?? result.usage, // Use totalUsage if available, fallback to usage
    latency: latency ?? undefined,
  };
}

export const listModels = async (providerId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${GATEWAY_URL}/models`, {
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