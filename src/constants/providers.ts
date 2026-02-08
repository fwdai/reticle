export const PROVIDERS = {
  OPENAI: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
  },
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
  },
  GOOGLE: {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
  },
} as const;

// Export as array for easier iteration
export const PROVIDERS_LIST = Object.values(PROVIDERS);

export default PROVIDERS;