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

const FALLBACK_OPTIONS: ProviderModelOptions = {
  openai: {
    label: "OpenAI",
    models: [
      { value: "gpt-4o-mini", label: "gpt-4o-mini" },
      { value: "gpt-4o", label: "gpt-4o" },
      { value: "gpt-4.1", label: "gpt-4.1" },
    ],
  },
  anthropic: {
    label: "Anthropic",
    models: [
      { value: "claude-3-haiku", label: "claude-3-haiku" },
      { value: "claude-3-5-sonnet", label: "claude-3.5-sonnet" },
    ],
  },
  google: {
    label: "Google",
    models: [
      { value: "gemini-2.0-flash", label: "gemini-2.0-flash" },
      { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite" },
    ],
  },
};

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
  return Object.keys(result).length > 0 ? result : FALLBACK_OPTIONS;
}

interface JudgeModelSelectProps {
  value?: { provider: string; model: string } | null;
  onChange: (value: { provider: string; model: string }) => void;
}

export function JudgeModelSelect({ value, onChange }: JudgeModelSelectProps) {
  const [options, setOptions] = useState<ProviderModelOptions>(FALLBACK_OPTIONS);

  useEffect(() => {
    fetchAndNormalizeModels().then((providerModels) => {
      setOptions(buildOptions(providerModels));
    });
  }, []);

  const providerIds = Object.keys(options);
  const provider = value?.provider ?? providerIds[0] ?? "openai";
  const model = value?.model ?? options[provider]?.models[0]?.value ?? "gpt-4o-mini";
  const currentProvider = providerIds.includes(provider) ? provider : providerIds[0] ?? "openai";
  const models = options[currentProvider]?.models ?? [];
  const currentModel = models.some((m) => m.value === model)
    ? model
    : models[0]?.value ?? "gpt-4o-mini";

  const handleProviderChange = (provider: string) => {
    const nextModels = options[provider]?.models ?? [];
    const model = nextModels[0]?.value ?? "gpt-4o-mini";
    onChange({ provider, model });
  };

  const handleModelChange = (model: string) => {
    onChange({ provider: currentProvider, model });
  };

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
