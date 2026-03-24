import { useAgentContext } from "@/contexts/AgentContext";
import { ModelParams } from "@/components/ModelParams";

interface ConfigurationProps {
  provider: string;
  model: string;
  temperature: number[];
  maxTokens: number[];
  seed: string;
  showAdvanced: boolean;
  onProviderChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onTemperatureChange: (value: number[]) => void;
  onMaxTokensChange: (value: number[]) => void;
  onSeedChange: (value: string) => void;
  onShowAdvancedToggle: () => void;
}

export default function Configuration({
  provider,
  model,
  temperature,
  maxTokens,
  seed,
  showAdvanced,
  onProviderChange,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  onSeedChange,
  onShowAdvancedToggle,
}: ConfigurationProps) {
  const { providerModels } = useAgentContext();
  const models = providerModels[provider] ?? [];

  return (
    <div className="h-full min-w-0 overflow-y-auto custom-scrollbar bg-slate-50 p-5">
      <ModelParams
        title="Model & Params"
        provider={provider}
        model={model}
        temperature={temperature[0]}
        maxTokens={maxTokens[0]}
        models={models}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onTemperatureChange={(v) => onTemperatureChange([v])}
        onMaxTokensChange={(v) => onMaxTokensChange([v])}
        temperatureMax={2}
        temperatureStep={0.01}
        maxTokensMax={16384}
        maxTokensStep={128}
        seed={seed}
        onSeedChange={onSeedChange}
        showAdvanced={showAdvanced}
        onShowAdvancedToggle={onShowAdvancedToggle}
      />
    </div>
  );
}
