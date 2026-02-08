export const PROVIDERS = {
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/',
  },
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/',
  },
  GOOGLE: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://api.google.com/',
  },
} as const;

// Export as array for easier iteration
export const PROVIDERS_LIST = Object.values(PROVIDERS);

export default PROVIDERS;