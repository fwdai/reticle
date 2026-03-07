import { describe, it, expect, vi, beforeAll } from 'vitest';
import { GatewayFetch } from '@/lib/gateway/GatewayFetch';

// The constructor calls originalFetch.bind(window); define window for the node environment.
beforeAll(() => {
  (globalThis as any).window = globalThis;
});

function makeResponse(
  body = '{}',
  headers: Record<string, string> = {}
): Response {
  return new Response(body, { headers });
}

describe('GatewayFetch', () => {
  describe('fetch', () => {
    it('passes input and init through to the underlying fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue(makeResponse());
      const gf = new GatewayFetch(mockFetch);

      const init = { method: 'POST', body: '{}' };
      await gf.fetch('https://example.com/api', init);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', init);
    });

    it('returns the response from the underlying fetch unchanged', async () => {
      const response = makeResponse('hello');
      const mockFetch = vi.fn().mockResolvedValue(response);
      const gf = new GatewayFetch(mockFetch);

      const result = await gf.fetch('https://example.com');

      expect(result).toBe(response);
    });

    it('parses x-request-latency-ms and stores it as latency', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        makeResponse('{}', { 'x-request-latency-ms': '123' })
      );
      const gf = new GatewayFetch(mockFetch);

      await gf.fetch('https://example.com');

      expect(gf.getLatency()).toBe(123);
    });

    it('ignores a non-numeric latency header', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        makeResponse('{}', { 'x-request-latency-ms': 'not-a-number' })
      );
      const gf = new GatewayFetch(mockFetch);

      await gf.fetch('https://example.com');

      expect(gf.getLatency()).toBeNull();
    });

    it('clears stale metadata before each new fetch call', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(makeResponse('{}', { 'x-request-latency-ms': '50' }))
        .mockResolvedValueOnce(makeResponse('{}'));
      const gf = new GatewayFetch(mockFetch);

      await gf.fetch('https://example.com');
      expect(gf.getLatency()).toBe(50);

      await gf.fetch('https://example.com');
      expect(gf.getLatency()).toBeNull();
    });

    it('clears metadata and rethrows when the underlying fetch rejects', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce(makeResponse('{}', { 'x-request-latency-ms': '99' }))
        .mockRejectedValueOnce(new Error('network error'));
      const gf = new GatewayFetch(mockFetch);

      await gf.fetch('https://example.com');
      expect(gf.getLatency()).toBe(99);

      await expect(gf.fetch('https://example.com')).rejects.toThrow('network error');
      expect(gf.getLatency()).toBeNull();
      expect(gf.getProxyMetadata()).toEqual({});
    });
  });

  describe('getLatency', () => {
    it('returns null before any fetch has been made', () => {
      const mockFetch = vi.fn();
      const gf = new GatewayFetch(mockFetch);

      expect(gf.getLatency()).toBeNull();
    });

    it('returns null when the response has no latency header', async () => {
      const mockFetch = vi.fn().mockResolvedValue(makeResponse());
      const gf = new GatewayFetch(mockFetch);

      await gf.fetch('https://example.com');

      expect(gf.getLatency()).toBeNull();
    });
  });

  describe('getProxyMetadata', () => {
    it('returns an empty object before any fetch', () => {
      const mockFetch = vi.fn();
      const gf = new GatewayFetch(mockFetch);

      expect(gf.getProxyMetadata()).toEqual({});
    });

    it('returns collected metadata after a fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        makeResponse('{}', { 'x-request-latency-ms': '42' })
      );
      const gf = new GatewayFetch(mockFetch);

      await gf.fetch('https://example.com');

      expect(gf.getProxyMetadata()).toEqual({ latency: 42 });
    });

    it('returns a copy — mutating the result does not affect internal state', async () => {
      const mockFetch = vi.fn().mockResolvedValue(
        makeResponse('{}', { 'x-request-latency-ms': '10' })
      );
      const gf = new GatewayFetch(mockFetch);
      await gf.fetch('https://example.com');

      const meta = gf.getProxyMetadata();
      meta.latency = 9999;

      expect(gf.getLatency()).toBe(10);
    });
  });
});
