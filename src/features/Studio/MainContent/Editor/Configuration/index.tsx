import { useContext } from 'react';
import { ChevronDown, Info } from "lucide-react";
import { StudioContext } from '@/contexts/StudioContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { PROVIDERS_LIST } from '@/constants/providers';

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

  return (
    <aside className="w-full h-full flex-shrink-0 bg-slate-50 overflow-y-auto custom-scrollbar">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Configuration
          </h3>
          <Info
            className="text-text-muted cursor-pointer hover:text-text-main"
            size={16}
          />
        </div>
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="font-bold text-text-main">Provider</Label>
            <Select
              name="provider"
              value={configuration.provider}
              onValueChange={(value) => handleValueChange('provider', value)}
            >
              <SelectTrigger className="w-full text-sm rounded-lg border border-border-light bg-white py-2.5 px-3 shadow-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all cursor-pointer text-text-main [&>svg]:text-text-muted">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-border-light bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1">
                {PROVIDERS_LIST.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id} className="py-2.5 pl-8 pr-3 text-text-main focus:bg-slate-50">
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="font-bold text-text-main">Model</Label>
            <Select
              name="model"
              value={configuration.model}
              onValueChange={(value) => handleValueChange('model', value)}
            >
              <SelectTrigger className="w-full text-sm rounded-lg border border-border-light bg-white py-2.5 px-3 shadow-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all cursor-pointer text-text-main [&>svg]:text-text-muted">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-border-light bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1">
                {studioState.providerModels[configuration.provider]?.map((model: any) => (
                  <SelectItem key={model.id} value={model.id} className="py-2.5 pl-8 pr-3 text-text-main focus:bg-slate-50">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-6 pt-6 border-t border-border-light">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-text-main">Temperature</Label>
                <Input
                  name="temperature"
                  className="w-16 h-8 text-right bg-sidebar-light border-none text-xs font-mono text-text-main font-bold focus:ring-0 p-0 shadow-none"
                  type="number"
                  value={configuration.temperature}
                  onChange={(e) => handleValueChange('temperature', parseFloat(e.target.value))}
                  step={0.1}
                  max={1}
                  min={0}
                  readOnly // Make it read-only
                />
              </div>
              <Slider
                name="temperature"
                max={1}
                min={0}
                step={0.1}
                value={[configuration.temperature]}
                onValueChange={(value) => handleValueChange('temperature', value[0])}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-text-main">Top P</Label>
                <Input
                  name="topP"
                  className="w-16 h-8 text-right bg-sidebar-light border-none text-xs font-mono text-text-main font-bold focus:ring-0 p-0 shadow-none"
                  type="number"
                  value={configuration.topP}
                  onChange={(e) => handleValueChange('topP', parseFloat(e.target.value))}
                  step={0.05}
                  max={1}
                  min={0}
                  readOnly // Make it read-only
                />
              </div>
              <Slider
                name="topP"
                max={1}
                min={0}
                step={0.05}
                value={[configuration.topP]}
                onValueChange={(value) => handleValueChange('topP', value[0])}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-text-main">Max Tokens</Label>
                <Input
                  name="maxTokens"
                  className="w-20 h-8 text-right bg-sidebar-light border-none text-xs font-mono text-text-main font-bold focus:ring-0 p-0 shadow-none"
                  type="number"
                  value={configuration.maxTokens}
                  onChange={(e) => handleValueChange('maxTokens', parseInt(e.target.value, 10))}
                  step={1}
                  max={4096}
                  min={1}
                  readOnly // Make it read-only
                />
              </div>
              <Slider
                name="maxTokens"
                max={4096}
                min={1}
                step={1}
                value={[configuration.maxTokens]}
                onValueChange={(value) => handleValueChange('maxTokens', value[0])}
              />
            </div>
          </div>
          <div className="pt-6">
            <button className="w-full flex items-center justify-between text-xs font-bold text-text-muted hover:text-text-main transition-colors">
              ADVANCED OPTIONS
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Configuration;