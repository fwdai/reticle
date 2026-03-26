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
} as const;

// Export as array for easier iteration
export const PROVIDERS_LIST = Object.values(PROVIDERS);

export default PROVIDERS;