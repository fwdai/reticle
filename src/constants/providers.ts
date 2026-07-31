export const PROVIDERS = {
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    header: 'Authorization',
  },
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    header: 'X-Api-Key',
  },
  GOOGLE: {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    header: 'Authorization',
  },
  LOCAL: {
    id: 'local',
    // Default target for any OpenAI-compatible local server (Ollama, LM Studio, vLLM, etc.).
    // Overridable per-user via Settings → API Keys ("local_provider_base_url" setting) —
    // see getProviderHeaders() in lib/gateway/helpers.ts.
    name: 'Local (OpenAI-compatible)',
    baseUrl: 'http://127.0.0.1:11434',
    header: 'Authorization',
  },
} as const;

// Export as array for easier iteration
export const PROVIDERS_LIST = Object.values(PROVIDERS);

export default PROVIDERS;