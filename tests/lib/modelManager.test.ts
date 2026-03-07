import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/gateway', () => ({ listModels: vi.fn() }));
vi.mock('@/constants/providers', () => ({
  PROVIDERS_LIST: [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
  ],
}));

// localStorage must be stubbed before any function that reads it is called.
// modelManager.ts only accesses localStorage inside function bodies so this is safe.
let store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
});

import { listModels } from '@/lib/gateway';
import { clearModelCache, fetchAndNormalizeModels, getProviderForModel } from '@/lib/modelManager';

const mockListModels = vi.mocked(listModels);
const CACHE_KEY = 'allModelCache';

/** Write a fresh (non-expired) cache entry to the localStorage store. */
function seedCache(data: Record<string, unknown[]>) {
  store[CACHE_KEY] = JSON.stringify({ data, timestamp: Date.now() });
}

beforeEach(() => {
  vi.resetAllMocks();
  store = {};
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// ── clearModelCache ────────────────────────────────────────────────────────────

describe('clearModelCache', () => {
  it('removes the allModelCache key from localStorage', () => {
    store[CACHE_KEY] = 'some-value';
    clearModelCache();
    expect(store[CACHE_KEY]).toBeUndefined();
  });

  it('does not throw when the cache key is already absent', () => {
    expect(() => clearModelCache()).not.toThrow();
  });
});

// ── fetchAndNormalizeModels ────────────────────────────────────────────────────

describe('fetchAndNormalizeModels — cache behaviour', () => {
  it('returns empty arrays per provider when every provider fetch fails and cache is empty', async () => {
    mockListModels.mockRejectedValue(new Error('network'));
    const result = await fetchAndNormalizeModels();
    expect(result).toEqual({ openai: [], anthropic: [] });
  });

  it('uses fresh cache and skips calling listModels', async () => {
    seedCache({ openai: [{ id: 'gpt-5' }], anthropic: [{ id: 'claude-opus-4-6' }] });
    await fetchAndNormalizeModels();
    expect(mockListModels).not.toHaveBeenCalled();
  });

  it('fetches when cache is stale (older than 1 hour)', async () => {
    store[CACHE_KEY] = JSON.stringify({
      data: { openai: [{ id: 'gpt-5' }] },
      timestamp: Date.now() - 61 * 60 * 1000,
    });
    mockListModels.mockResolvedValue([]);

    await fetchAndNormalizeModels();

    expect(mockListModels).toHaveBeenCalled();
  });

  it('does not cache providers that returned empty results', async () => {
    mockListModels.mockResolvedValue([]);
    await fetchAndNormalizeModels();
    expect(store[CACHE_KEY]).toBeUndefined();
  });

  it('only caches providers with non-empty results', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }])  // openai
      .mockResolvedValueOnce([]);                  // anthropic

    await fetchAndNormalizeModels();

    const cached = JSON.parse(store[CACHE_KEY]);
    expect(cached.data.openai).toBeDefined();
    expect(cached.data.anthropic).toBeUndefined();
  });

  it('replaces corrupt cache and fetches fresh data', async () => {
    store[CACHE_KEY] = 'not-valid-json';
    mockListModels.mockResolvedValue([{ id: 'gpt-5' }]);

    await fetchAndNormalizeModels();

    expect(mockListModels).toHaveBeenCalled();
  });
});

describe('fetchAndNormalizeModels — normalisation', () => {
  it('maps model.id to id and falls back to model.name', async () => {
    mockListModels
      .mockResolvedValueOnce([{ name: 'fallback-model' }]) // openai — no id field
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.some(m => m.id === 'fallback-model')).toBe(true);
  });

  it('prefers display_name over id for the name field', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5', display_name: 'GPT-5' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const model = result.openai.find(m => m.id === 'gpt-5');
    expect(model?.name).toBe('GPT-5');
  });

  it('prefers displayName (camelCase) over id when display_name is absent', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5', displayName: 'GPT Five' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const model = result.openai.find(m => m.id === 'gpt-5');
    expect(model?.name).toBe('GPT Five');
  });

  it('falls back to id for the name field when no display name is provided', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const model = result.openai.find(m => m.id === 'gpt-5');
    expect(model?.name).toBe('gpt-5');
  });
});

describe('fetchAndNormalizeModels — filtering', () => {
  it('excludes non-text models (tts)', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'tts-1' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.map(m => m.id)).not.toContain('tts-1');
  });

  it('excludes non-text models (dall-e)', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'dall-e-3' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.map(m => m.id)).not.toContain('dall-e-3');
  });

  it('excludes non-text models (whisper)', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'whisper-1' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.map(m => m.id)).not.toContain('whisper-1');
  });

  it('excludes non-text models (text-embedding)', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'text-embedding-3-small' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.map(m => m.id)).not.toContain('text-embedding-3-small');
  });

  it('excludes legacy gpt-3.5-turbo', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'gpt-3.5-turbo' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.map(m => m.id)).not.toContain('gpt-3.5-turbo');
  });

  it('excludes legacy gpt-4 and its variants', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'gpt-4' }, { id: 'gpt-4-turbo' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const ids = result.openai.map(m => m.id);
    expect(ids).not.toContain('gpt-4');
    expect(ids).not.toContain('gpt-4-turbo');
  });

  it('keeps a valid model through filtering', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    expect(result.openai.map(m => m.id)).toContain('gpt-5');
  });
});

describe('fetchAndNormalizeModels — deduplication', () => {
  it('keeps only the base model when a dated variant is also present', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'gpt-5-2025-01-01' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const ids = result.openai.map(m => m.id);
    expect(ids.filter(id => id.startsWith('gpt-5'))).toHaveLength(1);
    expect(ids).toContain('gpt-5');
  });

  it('keeps the base form when a -latest variant is also present', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-5' }, { id: 'gpt-5-latest' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const ids = result.openai.map(m => m.id);
    expect(ids.filter(id => id.startsWith('gpt-5'))).toHaveLength(1);
    expect(ids).toContain('gpt-5');
  });

  it('treats gpt-4o and gpt-4o-mini as distinct (different base ids)', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'gpt-4o' }, { id: 'gpt-4o-mini' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const ids = result.openai.map(m => m.id);
    expect(ids).toContain('gpt-4o');
    expect(ids).toContain('gpt-4o-mini');
  });
});

describe('fetchAndNormalizeModels — sorting', () => {
  it('places gpt- models before o-models for openai', async () => {
    mockListModels
      .mockResolvedValueOnce([{ id: 'o3' }, { id: 'gpt-5' }])
      .mockResolvedValueOnce([]);

    const result = await fetchAndNormalizeModels();
    const ids = result.openai.map(m => m.id);
    expect(ids.indexOf('gpt-5')).toBeLessThan(ids.indexOf('o3'));
  });

  it('sorts non-openai providers descending by name', async () => {
    mockListModels
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'claude-haiku-4-5' },
        { id: 'claude-opus-4-6' },
        { id: 'claude-sonnet-4-6' },
      ]);

    const result = await fetchAndNormalizeModels();
    const names = result.anthropic.map(m => m.name);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  it('returns an empty array for a provider with no models in cache', async () => {
    seedCache({ openai: [{ id: 'gpt-5' }] }); // anthropic absent from cache

    const result = await fetchAndNormalizeModels();
    expect(result.anthropic).toEqual([]);
  });
});

// ── getProviderForModel ────────────────────────────────────────────────────────

describe('getProviderForModel', () => {
  it('returns the provider id for an exact model id match', async () => {
    seedCache({ openai: [{ id: 'gpt-4o' }], anthropic: [] });
    expect(await getProviderForModel('gpt-4o')).toBe('openai');
  });

  it('returns the provider when model id starts with a cached entry id', async () => {
    // e.g. 'gpt-4o-2024-11-20'.startsWith('gpt-4o') is true
    seedCache({ openai: [{ id: 'gpt-4o' }], anthropic: [] });
    expect(await getProviderForModel('gpt-4o-2024-11-20')).toBe('openai');
  });

  it('returns the provider when a cached entry id starts with the model id', async () => {
    // e.g. 'gpt-4o'.startsWith('gpt-4') → matches
    seedCache({ openai: [{ id: 'gpt-4o' }], anthropic: [] });
    expect(await getProviderForModel('gpt-4')).toBe('openai');
  });

  it('returns "–" when model is not found in any provider', async () => {
    seedCache({ openai: [{ id: 'gpt-4o' }], anthropic: [] });
    expect(await getProviderForModel('gemini-2.5-pro')).toBe('–');
  });

  it('returns "–" when all provider fetches fail (no cache)', async () => {
    // listModels throws per-provider; fetchRawModels catches each and returns empty data
    mockListModels.mockRejectedValue(new Error('network'));
    expect(await getProviderForModel('gpt-4o')).toBe('–');
  });

  it('matches models using the name field when id is absent', async () => {
    seedCache({ openai: [{ name: 'some-model' }], anthropic: [] });
    expect(await getProviderForModel('some-model')).toBe('openai');
  });
});
