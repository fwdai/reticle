// src/lib/gateway/GatewayFetchWrapper.ts
interface ProxyMetadata {
  latency?: number;
  [key: string]: any;
}

/**
 * A class that wraps the native fetch API to intercept responses and extract
 * custom metadata from proxy-specific headers.
 * Each instance of this wrapper manages its own collected metadata for a single request lifecycle.
 */
class GatewayFetch {
  private metadata: ProxyMetadata = {};
  private originalFetch: typeof fetch;

  constructor(originalFetch: typeof fetch = fetch) {
    this.originalFetch = originalFetch.bind(window);
  }

  /**
   * This method serves as the custom fetch implementation. It makes the actual HTTP request,
   * extracts relevant headers, stores them as metadata, and then returns the original Response.
   */
  public fetch: typeof fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    // Clear metadata for a new fetch call to ensure no stale data
    this.metadata = {};
    try {
      const response = await this.originalFetch(input, init);

      // --- Start Generic Header Extraction ---
      // Latency extraction (example)
      const latencyHeader = response.headers.get('x-request-latency-ms');
      if (latencyHeader) {
        const parsedLatency = parseInt(latencyHeader, 10);
        if (!isNaN(parsedLatency)) {
          this.metadata.latency = parsedLatency;
        }
      }

      // --- Future: Add more header extractions here ---
      // Example: Extract a custom request ID header
      // const requestIdHeader = response.headers.get('X-Proxy-Request-Id');
      // if (requestIdHeader) {
      //   this.metadata.requestId = requestIdHeader;
      // }
      // -----------------------------------------------

      return response;
    } catch (error) {
      // On error, ensure metadata is cleared
      this.metadata = {};
      throw error;
    }
  };

  /**
   * Retrieves the latency measured during the last fetch call associated with this wrapper instance.
   * @returns The latency in milliseconds, or null if not available.
   */
  public getLatency(): number | null {
    return this.metadata.latency ?? null;
  }

  /**
   * Retrieves all collected proxy metadata for the last fetch call.
   * @returns An object containing all extracted metadata. Returns a copy to prevent external modification.
   */
  public getProxyMetadata(): ProxyMetadata {
    return { ...this.metadata };
  }
}

export { GatewayFetch, type ProxyMetadata };