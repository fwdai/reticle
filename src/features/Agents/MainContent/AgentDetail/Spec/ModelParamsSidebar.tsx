import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
] as const;

const MODELS = [
  { value: "gpt-4.1", label: "gpt-4.1" },
  { value: "gpt-4o", label: "gpt-4o" },
  { value: "gpt-4-turbo", label: "gpt-4-turbo" },
  { value: "claude-3.5-sonnet", label: "claude-3.5-sonnet" },
  { value: "claude-3-opus", label: "claude-3-opus" },
  { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
] as const;

interface ModelParamsSidebarProps {
  provider: string;
  model: string;
  temperature: number[];
  topP: number[];
  maxTokens: number[];
  seed: string;
  showAdvanced: boolean;
  onProviderChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onTemperatureChange: (value: number[]) => void;
  onTopPChange: (value: number[]) => void;
  onMaxTokensChange: (value: number[]) => void;
  onSeedChange: (value: string) => void;
  onShowAdvancedToggle: () => void;
}

export function ModelParamsSidebar({
  provider,
  model,
  temperature,
  topP,
  maxTokens,
  seed,
  showAdvanced,
  onProviderChange,
  onModelChange,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
  onSeedChange,
  onShowAdvancedToggle,
}: ModelParamsSidebarProps) {
  return (
    <div className="h-full min-w-0 overflow-y-auto custom-scrollbar bg-slate-50 p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
        Model & Params
      </h3>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-text-main">Provider</Label>
          <Select value={provider} onValueChange={onProviderChange}>
            <SelectTrigger className="h-9 text-xs border-border-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-text-main">Model</Label>
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger className="h-9 text-xs border-border-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-px bg-border-light" />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-text-main">Temperature</Label>
            <span className="font-mono text-xs font-medium text-primary">
              {temperature[0].toFixed(2)}
            </span>
          </div>
          <Slider value={temperature} onValueChange={onTemperatureChange} max={2} step={0.01} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-text-main">Top P</Label>
            <span className="font-mono text-xs font-medium text-primary">
              {topP[0].toFixed(2)}
            </span>
          </div>
          <Slider value={topP} onValueChange={onTopPChange} max={1} step={0.01} />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-text-main">Max Tokens</Label>
            <span className="font-mono text-xs font-medium text-primary">{maxTokens[0]}</span>
          </div>
          <Slider value={maxTokens} onValueChange={onMaxTokensChange} max={16384} step={128} />
        </div>
        <button
          onClick={onShowAdvancedToggle}
          className="flex w-full items-center justify-between border-t border-border-light pt-5 text-[10px] font-semibold tracking-widest text-text-muted hover:text-text-main transition-colors"
        >
          ADVANCED
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")}
          />
        </button>
        {showAdvanced && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-text-main">Seed</Label>
              <Input
                value={seed}
                onChange={(e) => onSeedChange(e.target.value)}
                placeholder="Optional seed..."
                className="h-9 text-xs border-border-light bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
