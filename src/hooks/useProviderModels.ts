import { useState, useEffect } from "react";
import { fetchAndNormalizeModels } from "@/lib/modelManager";

export type ProviderModels = Record<string, { id: string; name: string }[]>;

export function useProviderModels(): ProviderModels {
  const [providerModels, setProviderModels] = useState<ProviderModels>({});

  useEffect(() => {
    fetchAndNormalizeModels().then(setProviderModels);
  }, []);

  return providerModels;
}
