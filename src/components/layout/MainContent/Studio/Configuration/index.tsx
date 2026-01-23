import React, { useContext } from 'react';
import { ChevronDown, Info } from "lucide-react";
import { StudioContext } from '@/contexts/StudioContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

function Configuration() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error('Configuration component must be used within a StudioProvider');
  }

  const { studioState, setStudioState } = context;
  const configuration = studioState.currentInteraction.configuration;

  const handleValueChange = (name: string, value: string | number) => {
    setStudioState(prevStudioState => ({
      ...prevStudioState,
      currentInteraction: {
        ...prevStudioState.currentInteraction,
        configuration: {
          ...prevStudioState.currentInteraction.configuration,
          [name]: value,
        },
      },
    }));
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-sidebar-light overflow-y-auto custom-scrollbar">
      <div className="p-8">
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
            <Label className="font-bold text-text-main">LLM Provider</Label>
            <Select
              name="llmProvider"
              value={configuration.llmProvider}
              onValueChange={(value) => handleValueChange('llmProvider', value)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border-border-light bg-white py-2.5 px-3 shadow-sm focus:ring-primary focus:border-primary transition-all cursor-pointer">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OpenAI">OpenAI</SelectItem>
                <SelectItem value="Anthropic">Anthropic</SelectItem>
                <SelectItem value="Google Gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="font-bold text-text-main">Model Variant</Label>
            <Select
              name="modelVariant"
              value={configuration.modelVariant}
              onValueChange={(value) => handleValueChange('modelVariant', value)}
            >
              <SelectTrigger className="w-full text-sm rounded-xl border-border-light bg-white py-2.5 px-3 shadow-sm focus:ring-primary focus:border-primary transition-all cursor-pointer">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-2024-05-13">gpt-4o-2024-05-13</SelectItem>
                <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
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