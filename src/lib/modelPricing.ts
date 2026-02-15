// OpenAI pricing in cents per million tokens
// Prices can be inspected at https://developers.openai.com/api/docs/models/compare
const OPENAI_PRICING = {
  'gpt-5.2-pro': {
    input: 2100,
    output: 16800,
    cached: null,
  },
  'gpt-5.2': {
    input: 175,
    output: 1400,
    cached: 60,
  },
  'gpt-5.1': {
    input: 175, 
    output: 1400,
    cached: 60,
  },
  'gpt-5-pro': {
    input: 1500,
    output: 12000,
    cached: null,
  },
  'gpt-5': {
    input: 125,
    output: 1000,
    cached: 13,
  },
  'gpt-5-mini': {
    input: 25,
    output: 200,
    cached: 3,
  },
  'gpt-5-nano': {
    input: 5,
    output: 40,
    cached: 1,
  },
  'gpt-4o': {
    input: 250,
    output: 1000,
    cached: 125,
  },
  'gpt-4o-mini': {
    input: 15,
    output: 60,
    cached: 8,
  },
  'gpt-4.1': {
    input: 200,
    output: 800,
    cached: 50,
  },
  'gpt-4.1-mini': {
    input: 40,
    output: 160,
    cached: 10,
  },
  'gpt-4.1-nano': {
    input: 10,
    output: 40,
    cached: 3,
  },
  'o4-mini': {
    input: 10,
    output: 40,
    cached: 3,
  },
  'o3': {
    input: 200,
    output: 800,
    cached: 50,
  },
  'o3-mini': {
    input: 110,
    output: 440,
    cached: 55,
  },
  'o3-pro': {
    input: 200,
    output: 800,
    cached: null,
  },
  'o1': {
    input: 1500,
    output: 6000,
    cached: 750,
  },
  'o1-pro': {
    input: 15000,
    output: 60000,
    cached: null,
  }
}


// Anthropic pricing in cents per million tokens
// Prices can be inspected at https://platform.claude.com/docs/en/about-claude/pricing
// Note: Caching is quite complex with with prices for writes, reads and store duration, so we'll skip it.
const ANTHROPIC_PRICING = {
  'claude-opus-4-6': {
    input: 500,
    output: 2500,
    cached: null,
  },
  'claude-opus-4-5': {
    input: 500,
    output: 2500,
    cached: null,
  },
  'claude-haiku-4-5': {
    input: 100,
    output: 500,
    cached: null,
  },
  'claude-sonnet-4-5': {
    input: 300,
    output: 4500,
    cached: null,
  },
  'claude-opus-4-1': {
    input: 1500,
    output: 7500,
    cached: null,
  },
  'claude-opus-4': {
    input: 1500,
    output: 7500,
    cached: null,
  },
  'claude-sonnet-4': {
    input: 300,
    output: 1500,
    cached: null,
  },
  'claude-3-7-sonnet': {
    input: 300,
    output: 1500,
    cached: null,
  },
  'claude-3-5-haiku': {
    input: 80,
    output: 400,
    cached: null,
  },
  'claude-3-haiku': {
    input: 25,
    output: 125,
    cached: null,
  }
}

// Google Gemini pricing in cents per million tokens
// Prices can be inspected at https://ai.google.dev/gemini-api/docs/pricing
// Note: Some models are actually a bit cheaper for the first 200k tokens, but we'll just
// the top tier price for simplicity.
const GOOGLE_PRICING = {
  "gemini-3-pro-preview": {
    input: 400,
    output: 1800,
    cached: null,
  },
  "gemini-3-flash-preview": {
    input: 50,
    output: 300,
    cached: null,
  },
  "gemini-2.5-pro": {
    input: 250,
    output: 1500,
    cached: null,
  },
  "gemini-2.5-flash": {
    input: 30,
    output: 250,
    cached: null,
  },
  "gemini-2.5-flash-lite": {
    input: 10,
    output: 40,
    cached: null,
  },
  "gemini-2.0-flash": {
    input: 10,
    output: 40,
    cached: null,
  },
  "gemini-2.0-flash-lite": {
    input: 7.5,
    output: 30,
    cached: null,
  }
}

export const PRICING = {
  openai: OPENAI_PRICING,
  anthropic: ANTHROPIC_PRICING,
  google: GOOGLE_PRICING
} as const;

type ProviderId = keyof typeof PRICING;

/** Strips -YYYY-MM-DD and -latest suffixes for pricing lookup */
function getBaseModelId(modelId: string): string {
  return modelId
    .replace(/-\d{4}-\d{2}-\d{2}$/, '')
    .replace(/-latest$/, '');
}

function findPricing(provider: ProviderId, modelId: string): { input: number; output: number; cached: number | null } | null {
  const providerPricing = PRICING[provider];
  if (!providerPricing) return null;

  const base = getBaseModelId(modelId);
  const pricing = (providerPricing as Record<string, { input: number; output: number; cached: number | null }>)[modelId]
    ?? (providerPricing as Record<string, { input: number; output: number; cached: number | null }>)[base];
  return pricing ?? null;
}

export interface RequestUsage {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
}

/**
 * Calculates the cost of an LLM request in USD based on token usage and model pricing.
 * Prices are in cents per million tokens; returns cost in dollars.
 * @param provider - Provider id: openai, anthropic, or google
 * @param modelId - Model id (e.g. gpt-4o, claude-3-5-sonnet-20241022)
 * @param usage - Token counts (input/output/cached)
 * @returns Cost in USD, or null if model pricing is unknown
 */
export function calculateRequestCost(
  provider: string,
  modelId: string,
  usage: RequestUsage
): number | null {
  const pricing = findPricing(provider as ProviderId, modelId);
  if (!pricing) return null;

  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const cachedTokens = usage.cachedTokens ?? 0;

  let costCents = 0;
  costCents += (inputTokens / 1_000_000) * pricing.input;
  costCents += (outputTokens / 1_000_000) * pricing.output;
  if (cachedTokens > 0 && pricing.cached != null) {
    costCents += (cachedTokens / 1_000_000) * pricing.cached;
  }

  return costCents / 100;
}