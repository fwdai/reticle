import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROVIDERS_LIST } from "@/constants/providers";
import { fetchAndNormalizeModels } from "@/lib/modelManager";

type ProviderModelOptions = Record<
  string,
  { label: string; models: { value: string; label: string }[] }
>;

function buildOptions(
  providerModels: Record<string, { id: string; name: string }[]>
): ProviderModelOptions {
  const result: ProviderModelOptions = {};
  for (const provider of PROVIDERS_LIST) {
    const models = providerModels[provider.id] ?? [];
    const validModels = models
      .filter((m) => Boolean(m?.id && m?.name))
      .map((m) => ({ value: m.id, label: m.name }));
    if (validModels.length > 0) {
      result[provider.id] = { label: provider.name, models: validModels };
    }
  }
  return result;
}

interface JudgeModelSelectProps {
  value?: { provider: string; model: string } | null;
  onChange: (value: { provider: string; model: string }) => void;
}

export function JudgeModelSelect({ value, onChange }: JudgeModelSelectProps) {
  const [options, setOptions] = useState<ProviderModelOptions>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAndNormalizeModels({ forceRefresh: true })
      .then((providerModels) => {
        setOptions(buildOptions(providerModels));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const providerIds = Object.keys(options);
  const provider = value?.provider ?? providerIds[0] ?? "";
  const model = value?.model ?? options[provider]?.models[0]?.value ?? "";
  const currentProvider = providerIds.includes(provider) ? provider : providerIds[0] ?? "";
  const models = options[currentProvider]?.models ?? [];
  const currentModel = models.some((m) => m.value === model)
    ? model
    : models[0]?.value ?? "";

  const handleProviderChange = (provider: string) => {
    const nextModels = options[provider]?.models ?? [];
    const model = nextModels[0]?.value ?? "";
    onChange({ provider, model });
  };

  const handleModelChange = (model: string) => {
    onChange({ provider: currentProvider, model });
  };

  if (providerIds.length === 0) {
    return (
      <p className="flex-1 text-[11px] text-slate-400">
        {isLoading ? "Loading provider models…" : "Add an API key in Settings to select a judge model."}
      </p>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2 min-w-0">
      <Select value={currentProvider} onValueChange={handleProviderChange}>
        <SelectTrigger className="h-8 w-[110px] text-[11px] bg-white border-slate-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {providerIds.map((id) => (
            <SelectItem key={id} value={id} className="text-xs">
              {options[id]?.label ?? id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={currentModel} onValueChange={handleModelChange}>
        <SelectTrigger className="h-8 min-w-[140px] flex-1 text-[11px] bg-white border-slate-200">
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
