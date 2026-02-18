import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ModelParamsSidebarProps {
  temperature: number[];
  topP: number[];
  maxTokens: number[];
  seed: string;
  showAdvanced: boolean;
  onTemperatureChange: (value: number[]) => void;
  onTopPChange: (value: number[]) => void;
  onMaxTokensChange: (value: number[]) => void;
  onSeedChange: (value: string) => void;
  onShowAdvancedToggle: () => void;
}

export function ModelParamsSidebar({
  temperature,
  topP,
  maxTokens,
  seed,
  showAdvanced,
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
          <Select defaultValue="openai">
            <SelectTrigger className="h-9 text-xs border-border-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-text-main">Model</Label>
          <Select defaultValue="gpt-4.1">
            <SelectTrigger className="h-9 text-xs border-border-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
              <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
              <SelectItem value="claude-3.5">claude-3.5-sonnet</SelectItem>
              <SelectItem value="claude-3-opus">claude-3-opus</SelectItem>
              <SelectItem value="gemini-pro">gemini-1.5-pro</SelectItem>
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
