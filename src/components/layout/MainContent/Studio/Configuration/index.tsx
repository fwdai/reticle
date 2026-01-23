import React, { useContext } from 'react';
import { ChevronDown, Info } from "lucide-react";
import { ConfigurationContext } from '@/contexts/ConfigurationContext';

function Configuration() {
  const context = useContext(ConfigurationContext);

  if (!context) {
    throw new Error('Configuration component must be used within a ConfigurationProvider');
  }

  const { configuration, setConfiguration } = context;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['temperature', 'topP', 'maxTokens'].includes(name);
    setConfiguration(prevConfig => ({
      ...prevConfig,
      [name]: isNumeric ? Number(value) : value,
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
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-main">
              LLM Provider
            </label>
            <select 
              name="llmProvider"
              value={configuration.llmProvider}
              onChange={handleInputChange}
              className="w-full text-sm rounded-xl border-border-light bg-white py-2.5 px-3 shadow-sm focus:ring-primary focus:border-primary transition-all cursor-pointer">
              <option>OpenAI</option>
              <option>Anthropic</option>
              <option>Google Gemini</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text-main">
              Model Variant
            </label>
            <select 
              name="modelVariant"
              value={configuration.modelVariant}
              onChange={handleInputChange}
              className="w-full text-sm rounded-xl border-border-light bg-white py-2.5 px-3 shadow-sm focus:ring-primary focus:border-primary transition-all cursor-pointer">
              <option>gpt-4o-2024-05-13</option>
              <option>gpt-4-turbo</option>
              <option>gpt-3.5-turbo</option>
            </select>
          </div>
          <div className="space-y-6 pt-6 border-t border-border-light">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-main">
                  Temperature
                </label>
                <input
                  name="temperature"
                  className="w-10 text-right bg-transparent border-none text-xs font-mono text-primary font-bold focus:ring-0 p-0"
                  type="number"
                  value={configuration.temperature}
                  onChange={handleInputChange}
                  step={0.1}
                  max={1}
                  min={0}
                />
              </div>
              <input
                name="temperature"
                className="w-full"
                max={1}
                min={0}
                step={0.1}
                type="range"
                value={configuration.temperature}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-main">Top P</label>
                <input
                  name="topP"
                  className="w-10 text-right bg-transparent border-none text-xs font-mono text-primary font-bold focus:ring-0 p-0"
                  type="number"
                  value={configuration.topP}
                  onChange={handleInputChange}
                  step={0.05}
                  max={1}
                  min={0}
                />
              </div>
              <input
                name="topP"
                className="w-full"
                max={1}
                min={0}
                step={0.05}
                type="range"
                value={configuration.topP}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-main">
                  Max Tokens
                </label>
                <input
                  name="maxTokens"
                  className="w-14 text-right bg-transparent border-none text-xs font-mono text-primary font-bold focus:ring-0 p-0"
                  type="number"
                  value={configuration.maxTokens}
                  onChange={handleInputChange}
                  step={1}
                  max={4096}
                  min={1}
                />
              </div>
              <input
                name="maxTokens"
                className="w-full"
                max={4096}
                min={1}
                step={1}
                type="range"
                value={configuration.maxTokens}
                onChange={handleInputChange}
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
