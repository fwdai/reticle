export const GATEWAY_URL = 'http://localhost:11513/v1';
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
