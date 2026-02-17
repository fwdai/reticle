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
}

/**
 * Fetches raw model lists for ALL providers from the API and constructs an AllModelCache object.
 * This function does NOT use caching internally; it always fetches fresh data.
 * @returns A Promise resolving to an AllModelCache object.
 */
const fetchRawModels = async (): Promise<AllModelCache> => {
  const providerModelsData: ProviderModels = {};
  for (const provider of PROVIDERS_LIST) {
    try {
      const rawModels = await listModels(provider.id);
      providerModelsData[provider.id] = rawModels;
    } catch (error) {
      console.error(`Failed to fetch raw models for provider ${provider.name}:`, error);
      providerModelsData[provider.id] = [];
    }
  }
  return { data: providerModelsData, timestamp: Date.now() };
}

/**
 * Manages caching for the entire AllModelCache object in localStorage.
 * It fetches fresh data for all providers if the cache is expired or missing.
 * @returns A Promise resolving to an AllModelCache object (from cache or newly fetched).
 */
const getAllModels = async (): Promise<ProviderModels> => {
  const allCacheString = localStorage.getItem(CACHE_KEY);
  let cachedData: AllModelCache = { data: {}, timestamp: 0 };
  let cacheIsFresh = false;

  if (allCacheString) {
    try {
      cachedData = JSON.parse(allCacheString);
      cacheIsFresh = (Date.now() - cachedData.timestamp < CACHE_DURATION);
    } catch (e) {
      console.error(`Failed to parse all models cache from localStorage:`, e);
      localStorage.removeItem(CACHE_KEY);
      cachedData = { data: {}, timestamp: 0 };
    }
  }

  if (cacheIsFresh) return cachedData.data;

  try {
    const newRawProviderModels = await fetchRawModels();
    const newAllModelCache: AllModelCache = {
      data: newRawProviderModels.data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(newAllModelCache));
    return newAllModelCache.data;
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
    return { id: model.id || model.name, name: model.display_name || model.displayName || model.id };
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
 * Fetches and normalizes all models for all providers.
 * @returns A Promise resolving to a record of provider IDs to arrays of normalized model objects.
 */
export const fetchAndNormalizeModels = async (): Promise<Record<string, { id: string; name: string }[]>> => {
  const allNormalizedModels: Record<string, { id: string; name: string }[]> = {};

  try {
    const allRawModelCache = await getAllModels();

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

  console.log(allNormalizedModels);

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