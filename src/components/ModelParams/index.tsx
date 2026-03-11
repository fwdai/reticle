import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { PROVIDERS_LIST } from "@/constants/providers";

export interface ModelOption {
  id: string;
  name: string;
}

export interface ModelParamsProps {
  title?: string;
  provider: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  models: ModelOption[];
  onProviderChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onTopPChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  temperatureMax?: number;
  temperatureStep?: number;
  maxTokensMax?: number;
  maxTokensStep?: number;
  headerAction?: ReactNode;
  seed?: string;
  onSeedChange?: (value: string) => void;
  showAdvanced?: boolean;
  onShowAdvancedToggle?: () => void;
  className?: string;
}

const valueInputClass =
  "w-16 h-8 text-right bg-sidebar-light border-none text-xs font-mono text-text-main font-bold focus:ring-0 p-0 shadow-none";

export function ModelParams({
  title = "Model & Params",
  provider,
  model,
  temperature,
  topP,
  maxTokens,
  models,
  onProviderChange,
  onModelChange,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
  temperatureMax = 1,
  temperatureStep = 0.1,
  maxTokensMax = 4096,
  maxTokensStep = 1,
  headerAction,
  seed = "",
  onSeedChange,
  showAdvanced = false,
  onShowAdvancedToggle,
  className,
}: ModelParamsProps) {
  const { setCurrentPage } = useAppContext();
  const topPStep = 0.05;
  const hasAdvanced = onShowAdvancedToggle != null;

  const noModelsSlot = (
    <div className="rounded-lg border border-dashed border-border-light bg-white px-3 py-3 text-center">
      <p className="text-[11px] text-text-muted">No models available.</p>
      <button
        className="mt-1 text-[11px] text-primary underline"
        onClick={() => setCurrentPage("settings", { settingsSection: "api-keys" })}
      >
        Add an API key in Settings
      </button>
    </div>
  );

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          {title}
        </h3>
        {headerAction}
      </div>
      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="font-bold text-text-main">Provider</Label>
          <Select value={provider} onValueChange={onProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS_LIST.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="font-bold text-text-main">Model</Label>
          {models.length === 0 ? (
            noModelsSlot
          ) : (
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-6 pt-6 border-t border-border-light">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-bold text-text-main">Temperature</Label>
              <Input
                className={cn(valueInputClass, "w-16")}
                type="number"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value) || 0)}
                step={temperatureStep}
                max={temperatureMax}
                min={0}
                readOnly
              />
            </div>
            <Slider
              max={temperatureMax}
              min={0}
              step={temperatureStep}
              value={[temperature]}
              onValueChange={(v) => onTemperatureChange(v[0])}
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-bold text-text-main">Top P</Label>
              <Input
                className={cn(valueInputClass, "w-16")}
                type="number"
                value={topP}
                onChange={(e) => onTopPChange(parseFloat(e.target.value) || 0)}
                step={topPStep}
                max={1}
                min={0}
                readOnly
              />
            </div>
            <Slider
              max={1}
              min={0}
              step={topPStep}
              value={[topP]}
              onValueChange={(v) => onTopPChange(v[0])}
            />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="font-bold text-text-main">Max Tokens</Label>
              <Input
                className={cn(valueInputClass, "w-20")}
                type="number"
                value={maxTokens}
                onChange={(e) => onMaxTokensChange(parseInt(e.target.value, 10) || 0)}
                step={maxTokensStep}
                max={maxTokensMax}
                min={1}
                readOnly
              />
            </div>
            <Slider
              max={maxTokensMax}
              min={1}
              step={maxTokensStep}
              value={[maxTokens]}
              onValueChange={(v) => onMaxTokensChange(v[0])}
            />
          </div>
        </div>
        {hasAdvanced && (
          <>
            <button
              onClick={onShowAdvancedToggle}
              className="flex w-full items-center justify-between border-t border-border-light pt-6 text-xs font-bold text-text-muted hover:text-text-main transition-colors"
            >
              ADVANCED OPTIONS
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")}
              />
            </button>
            {showAdvanced && onSeedChange != null && (
              <div className="space-y-2">
                <Label className="font-bold text-text-main">Seed</Label>
                <Input
                  value={seed}
                  onChange={(e) => onSeedChange(e.target.value)}
                  placeholder="Optional seed..."
                  className="h-9 text-xs border-border-light bg-white"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
