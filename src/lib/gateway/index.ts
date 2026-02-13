import { PROVIDERS_LIST } from '@/constants/providers';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText as generateTextAi } from 'ai';
import { Message } from 'ai/react'; // Import Message type from ai/react

import { GatewayFetch } from './GatewayFetch';
import { LLMCallConfig } from '@/types';

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

export const generateText = async (
  userPrompt: string,
  systemPrompt: string,
  history: Message[], // Assuming history items are compatible with Message from 'ai/react'
  config: LLMCallConfig
) => {
  const gateway = new GatewayFetch();

  const messages: Message[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // Add previous messages from history
  messages.push(...history);

  // Add the current user prompt
  messages.push({ role: 'user', content: userPrompt });

  const result = await generateTextAi({
    model: createModel(config, gateway),
    messages: messages,
    temperature: config.temperature,
    topP: config.topP,
    maxTokens: config.maxTokens,
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