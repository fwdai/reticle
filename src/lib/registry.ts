import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText as generateTextAi } from 'ai';

export const reticle = createOpenAICompatible({
  name: 'reticle',
  apiKey: '1',
  baseURL: 'http://localhost:11513/v1',
  includeUsage: true, // Include usage information in streaming responses
  headers: {
    'X-Proxy-Target-Url': 'https://api.openai.com',
  },
});

type Configuration = {
  modelVariant: string;
  systemPrompt: string;
}

/**
 * Creates a fetch wrapper that extracts latency from the Rust proxy's response header.
 * The latency is measured at the Rust level (actual HTTP request time) and returned
 * via the X-Request-Latency-Ms header.
 */
function createLatencyMeasuringFetch(): { fetch: typeof fetch; getLatency: () => number | null } {
  let latency: number | null = null;

  const measuringFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      // Make the actual HTTP request
      const response = await fetch(input, init);

      // Extract latency from the Rust proxy's response header
      // Read headers immediately but don't consume the body
      const latencyHeader = response.headers.get('X-Request-Latency-Ms') || 
                           response.headers.get('x-request-latency-ms');

      if (latencyHeader) {
        const parsedLatency = parseInt(latencyHeader, 10);
        if (!isNaN(parsedLatency)) {
          latency = parsedLatency;
        }
      }

      // Return the response exactly as-is - don't clone or modify
      // The ai package will handle the response body consumption
      return response;
    } catch (error) {
      // On error, latency won't be available
      latency = null;
      throw error;
    }
  };

  const getLatency = (): number | null => {
    return latency;
  };

  return { fetch: measuringFetch, getLatency };
}

export const generateText = async (prompt: string, configuration: Configuration) => {
  // Create a latency-measuring fetch for this request
  const { fetch: measuringFetch, getLatency } = createLatencyMeasuringFetch();

  // Use the existing reticle model but create a new instance with our fetch wrapper
  // This ensures we capture latency while preserving all the original model configuration
  const modelWithFetch = createOpenAICompatible({
    name: 'reticle',
    apiKey: '1',
    baseURL: 'http://localhost:11513/v1',
    includeUsage: true, // Important: must match original
    headers: {
      'X-Proxy-Target-Url': 'https://api.openai.com',
    },
    fetch: measuringFetch, // Use our latency-measuring fetch
  })(configuration.modelVariant);

  // Generate text using the model with latency measurement
  const result = await generateTextAi({
    model: modelWithFetch,
    system: configuration.systemPrompt,
    prompt,
  });

  // Get the measured latency
  const latency = getLatency();

  // Map the result properties: generateTextAi returns _output and totalUsage,
  // but we need to map them to text and usage for consistency
  return {
    ...result,
    text: result._output ?? result.text, // Use _output if available, fallback to text
    usage: result.totalUsage ?? result.usage, // Use totalUsage if available, fallback to usage
    latency: latency ?? undefined,
  };
}

// export const call = () => generateText({ model: reticle('gpt-4'), prompt: 'Hello' })