export const PROVIDERS = {
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
  },
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
  },
  GOOGLE: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://api.google.com/v1',
  },
} as const;

// Export as array for easier iteration
export const PROVIDERS_LIST = Object.values(PROVIDERS);

export default PROVIDERS;