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
import type { Tool } from '@/features/Studio/MainContent/Editor/Main/Tools/types';

const GATEWAY_URL = 'http://localhost:11513/v1';
const API_KEY = '1';

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

const createModel = (config: LLMCallConfig, gateway: GatewayFetch) => {
  const { provider, model } = config;

  return createOpenAICompatible({
    name: 'reticle',
    apiKey: API_KEY,
    baseURL: GATEWAY_URL,
    includeUsage: true, // Important: must match original
    headers: getProviderHeaders(provider),
    fetch: gateway.fetch, // Use our latency-measuring fetch
  })(model);
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
  tools?: Tool[]
) => {
  const gateway = new GatewayFetch();

  const messages: ModelMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // Add previous messages from history
  messages.push(...history);

  // Add the current user prompt
  messages.push({ role: 'user', content: userPrompt });

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