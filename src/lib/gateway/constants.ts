const GATEWAY_ORIGIN = 'http://localhost:11513';

/** Default OpenAI-compatible base; proxy forwards target base + incoming path. */
export const GATEWAY_URL = `${GATEWAY_ORIGIN}/v1`;

// Providers whose OpenAI-compatible endpoint lives at a non-/v1 path.
// Proxy forwards: target_url_base (X-Proxy-Target-Url) + incoming path.
export const PROVIDER_GATEWAY_BASE: Partial<Record<string, string>> = {
  google: `${GATEWAY_ORIGIN}/v1beta/openai`,
};

// Providers whose models list lives outside the standard /v1/models path.
export const PROVIDER_MODELS_URL: Partial<Record<string, string>> = {
  google: `${GATEWAY_ORIGIN}/v1beta/openai/models`,
};

export function getProviderGatewayBase(provider: string): string {
  return PROVIDER_GATEWAY_BASE[provider] ?? GATEWAY_URL;
}

export function getProviderModelsUrl(providerId: string): string {
  return PROVIDER_MODELS_URL[providerId] ?? `${GATEWAY_URL}/models`;
}

export const API_KEY = '1';
export const STEPS_COUNT = 5;
export const GATEWAY_NAME = 'reticle';

/** OpenAI reasoning models require max_completion_tokens instead of max_tokens. */
export const REASONING_MODEL_PREFIXES = [
  'o1',
  'o3',
  'o4-mini',
  'codex-mini',
  'computer-use-preview',
  'gpt-5',
] as const;

/** Required Anthropic API version header. */
export const ANTHROPIC_VERSION = '2023-06-01';
