import { useState, useEffect } from "react";
import { fetchAndNormalizeModels } from "@/lib/modelManager";

export type ProviderModels = Record<string, { id: string; name: string }[]>;

export function useProviderModels(): ProviderModels {
  const [providerModels, setProviderModels] = useState<ProviderModels>({});

  useEffect(() => {
    // Refresh once when a model-consuming screen mounts. If a provider is
    // temporarily unavailable, modelManager returns its last-known-good list.
    fetchAndNormalizeModels({ forceRefresh: true }).then(setProviderModels);
  }, []);

  return providerModels;
}
