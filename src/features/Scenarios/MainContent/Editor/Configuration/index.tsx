import { useContext } from 'react';
import { Info } from "lucide-react";
import { StudioContext } from '@/contexts/StudioContext';
import { ModelParams } from '@/components/ModelParams';

function Configuration() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error('Configuration component must be used within a StudioProvider');
  }

  const { studioState, setStudioState } = context;
  const configuration = studioState.currentScenario.configuration;

  const handleValueChange = (name: string, value: string | number) => {
    setStudioState(prevStudioState => ({
      ...prevStudioState,
      currentScenario: {
        ...prevStudioState.currentScenario,
        configuration: {
          ...prevStudioState.currentScenario.configuration,
          [name]: value,
        },
      },
    }));
  };

  const models = studioState.providerModels[configuration.provider] ?? [];

  return (
    <aside className="w-full h-full flex-shrink-0 bg-slate-50 overflow-y-auto custom-scrollbar">
      <div className="px-6 py-4">
        <ModelParams
          title="Configuration"
          provider={configuration.provider}
          model={configuration.model}
          temperature={configuration.temperature}
          topP={configuration.topP}
          maxTokens={configuration.maxTokens}
          models={models}
          onProviderChange={(value) => handleValueChange('provider', value)}
          onModelChange={(value) => handleValueChange('model', value)}
          onTemperatureChange={(value) => handleValueChange('temperature', value)}
          onTopPChange={(value) => handleValueChange('topP', value)}
          onMaxTokensChange={(value) => handleValueChange('maxTokens', value)}
          headerAction={
            <Info
              className="text-text-muted cursor-pointer hover:text-text-main"
              size={16}
            />
          }
        />
      </div>
    </aside>
  );
}

export default Configuration;