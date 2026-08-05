import { PROVIDERS_LIST } from '@/constants/providers';
import { listModels } from '@/lib/gateway';

const CACHE_KEY = 'allModelCache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const NON_TEXT_PATTERNS = [
  /^davinci/i, /^babbage/i, /^ada/i, /^curie/i, /^chatgpt/i,
  /\btts\b/i, /\bwhisper/i, /\btranscribe/i, /\bdiarize\b/i,
  /\bsora\b/i, /\bdall[-_]?e/i, /\bgpt-image\b/i,
  /\bgpt-audio\b/i, /\bgpt-realtime\b/i,
  /\btext-embedding\b/i, /\bomni-moderation\b/i,
  /\bsearch-preview\b/i, /\bsearch-api\b/i,
  /\bdeep-research\b/i, /\bcodex\b/i,
  /\baudio-preview\b/i, /\brealtime-preview\b/i,
  /\bchat-latest\b/i,

];

// Legacy models to exclude
const LEGACY_MODELS = [
  'gpt-3.5-turbo', 'gpt-4-turbo', 'gpt-4-turbo-preview',
  'gpt-4-turbo-2024-04', 'gpt-4-1106', 'gpt-4-0613', 'gpt-4-0314',
  'gpt-4-vision', 'gpt-4-32k', 'gpt-4',
];


interface ProviderModels {
  [providerId: string]: any[];
}

interface AllModelCache {
  data: ProviderModels;
  timestamp: number;
  providerTimestamps?: Record<string, number>;
}

interface ProviderFetchResult {
  providerId: string;
  models?: any[];
}

const pendingProviderRequests = new Map<string, Promise<any[]>>();

const fetchProviderModels = (providerId: string): Promise<any[]> => {
  const pending = pendingProviderRequests.get(providerId);
  if (pending) return pending;

  const request = listModels(providerId).finally(() => {
    pendingProviderRequests.delete(providerId);
  });
  pendingProviderRequests.set(providerId, request);
  return request;
};

/**
 * Fetches raw model lists for ALL providers from the API and constructs an AllModelCache object.
 * This function does NOT use caching internally; it always fetches fresh data.
 * @returns A Promise resolving to an AllModelCache object.
 */
const fetchRawModels = async (providerIds: string[]): Promise<ProviderFetchResult[]> => {
  return Promise.all(providerIds.map(async (providerId) => {
    const provider = PROVIDERS_LIST.find((item) => item.id === providerId);
    try {
      return { providerId, models: await fetchProviderModels(providerId) };
    } catch (error) {
      console.error(`Failed to fetch raw models for provider ${provider?.name ?? providerId}:`, error);
      return { providerId };
    }
  }));
}

/**
 * Manages caching for the entire AllModelCache object in localStorage.
 * It fetches fresh data for all providers if the cache is expired or missing.
 * @returns A Promise resolving to an AllModelCache object (from cache or newly fetched).
 */
const getAllModels = async (forceRefresh = false): Promise<ProviderModels> => {
  const allCacheString = localStorage.getItem(CACHE_KEY);
  let cachedData: AllModelCache = { data: {}, timestamp: 0 };

  if (allCacheString) {
    try {
      cachedData = JSON.parse(allCacheString);
    } catch (e) {
      console.error(`Failed to parse all models cache from localStorage:`, e);
      localStorage.removeItem(CACHE_KEY);
      cachedData = { data: {}, timestamp: 0 };
    }
  }

  const now = Date.now();
  const providersToFetch = PROVIDERS_LIST
    .filter((provider) => {
      if (forceRefresh || !cachedData.data[provider.id]) return true;
      const timestamp = cachedData.providerTimestamps
        ? (cachedData.providerTimestamps[provider.id] ?? 0)
        : cachedData.timestamp;
      return now - timestamp >= CACHE_DURATION;
    })
    .map((provider) => provider.id);

  if (providersToFetch.length === 0) return cachedData.data;

  try {
    const results = await fetchRawModels(providersToFetch);
    const dataToCache: ProviderModels = { ...cachedData.data };
    const providerTimestamps = { ...cachedData.providerTimestamps };
    let cacheChanged = false;

    for (const { providerId, models } of results) {
      // A missing `models` value is a failed request. Preserve the provider's
      // last-known-good catalog and leave its timestamp stale so it is retried.
      if (!models) continue;

      cacheChanged = true;
      if (models.length > 0) {
        dataToCache[providerId] = models;
        providerTimestamps[providerId] = now;
      } else {
        delete dataToCache[providerId];
        delete providerTimestamps[providerId];
      }
    }

    if (cacheChanged) {
      if (Object.keys(dataToCache).length > 0) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: dataToCache,
          timestamp: now,
          providerTimestamps,
        }));
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    return dataToCache;
  } catch (error) {
    console.error(`Failed to fetch and cache all raw models:`, error);
    if (Object.keys(cachedData.data).length > 0) {
      console.warn(`Falling back to stale consolidated cache due to fetch error.`);
      return cachedData.data;
    }
    throw error;
  }
}

/**
 * Normalizes a list of raw model objects into a consistent format.
 * @param rawModels The raw list of models.
 * @returns An array of normalized model objects: `{ id: string, name: string }`.
 */
const normalizeModels = (models: any[]): { id: string; name: string }[] => {
  return models.map((model: any) => {
    const rawId = model.id || model.name || '';
    // Google's API returns model names as "models/gemini-2.5-pro" — strip the prefix
    const id = rawId.startsWith('models/') ? rawId.slice('models/'.length) : rawId;
    return { id, name: model.display_name || model.displayName || id };
  });
}

/**
 * Returns the base model id (strips -YYYY-MM-DD and -latest suffixes).
 */
const getBaseModelId = (id: string): string => {
  return id
    .replace(/-\d{4}-\d{2}-\d{2}$/, '')  // Strip date suffix
    .replace(/-latest$/, '');            // Strip -latest
};

/**
 * Checks if a model id is legacy.
 */
const isLegacyModel = (id: string): boolean => {
  const lower = id.toLowerCase();
  return LEGACY_MODELS.some((legacy) => lower === legacy || lower.startsWith(legacy + '-'));
};

/**
 * Checks if a model is non-text-based (image, audio, video, embeddings, etc.).
 */
const isNonTextModel = (id: string): boolean => {
  return NON_TEXT_PATTERNS.some((pattern) => pattern.test(id));
};

const sortDesc = (a: { id: string; name: string }, b: { id: string; name: string }) =>
  b.name.localeCompare(a.name);

/**
 * Filters a list of models to primary text-based models only.
 * - Excludes non-text models (tts, whisper, sora, dall-e, embeddings, etc.)
 * - Deduplicates: keeps base form (e.g. gpt-5-nano), omits dated/-latest variants
 * - Excludes legacy models (gpt-3.5-turbo, gpt-4, etc.)
 * @param models The list of models to filter.
 * @param providerId Optional provider id; when 'openai', sorts gpt- models before o-models.
 * @returns An array of filtered model objects: `{ id: string, name: string }`.
 */
const filterModels = (
  models: { id: string; name: string }[],
  providerId?: string
): { id: string; name: string }[] => {
  const filtered = models.filter((m) => {
    if (isNonTextModel(m.id)) return false;
    if (isLegacyModel(m.id)) return false;
    if (providerId === 'google' && !m.id.startsWith('gemini-')) return false;
    return true;
  });

  // Deduplicate: group by base id, keep the canonical (shortest) form
  const byBase = new Map<string, { id: string; name: string }>();
  for (const m of filtered) {
    const base = getBaseModelId(m.id);
    const existing = byBase.get(base);
    if (!existing || m.id.length < existing.id.length) {
      byBase.set(base, m);
    }
  }

  const result = Array.from(byBase.values());

  if (providerId === 'openai') {
    const gptModels = result.filter((m) => m.id.startsWith('gpt-')).sort(sortDesc);
    const oModels = result.filter((m) => /^o\d/.test(m.id)).sort(sortDesc);
    const other = result.filter((m) => !m.id.startsWith('gpt-') && !/^o\d/.test(m.id)).sort(sortDesc);
    return [...gptModels, ...oModels, ...other];
  }

  return result.sort(sortDesc);
}


/**
 * Clears the model cache. Call this whenever API keys change so the next
 * fetchAndNormalizeModels() call gets a live list for the updated providers.
 */
export function clearModelCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Fetches and normalizes all models for all providers.
 * @returns A Promise resolving to a record of provider IDs to arrays of normalized model objects.
 */
export const fetchAndNormalizeModels = async (
  options: { forceRefresh?: boolean } = {}
): Promise<Record<string, { id: string; name: string }[]>> => {
  const allNormalizedModels: Record<string, { id: string; name: string }[]> = {};

  try {
    const allRawModelCache = await getAllModels(options.forceRefresh);

    for (const provider of PROVIDERS_LIST) {
      const providerModels = allRawModelCache[provider.id];
      if (providerModels) {
        // Normalize the raw models from the cache entry
        allNormalizedModels[provider.id] = filterModels(normalizeModels(providerModels), provider.id);
      } else {
        console.warn(`No raw models found for provider ${provider.name} in cache.`);
        allNormalizedModels[provider.id] = []; // Ensure the provider has an empty array
      }
    }
  } catch (error) {
    console.error("Failed to fetch or normalize all models:", error);
    // If the entire cacheModels operation failed, return an empty object
    return {};
  }

  return allNormalizedModels;
}


/**
 * Resolves provider id for a model by looking it up in the allRawModelCache.
 * Falls back to heuristic inference when cache is empty or model not found.
 */
export async function getProviderForModel(modelId: string): Promise<string> {
  try {
    const allRawModelCache = await getAllModels();
    for (const [providerId, models] of Object.entries(allRawModelCache)) {
      const list = Array.isArray(models) ? models : [];
      const found = list.some((m: { id?: string; name?: string }) => {
        const id = m?.id ?? m?.name ?? "";
        return id === modelId || modelId.startsWith(id) || id.startsWith(modelId);
      });
      if (found) return providerId;
    }
  } catch {
    /* ignore */
  }
  return '–';
}
