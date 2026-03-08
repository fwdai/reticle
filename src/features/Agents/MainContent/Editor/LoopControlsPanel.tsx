import { RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { panelBase, panelHeader, panelTitle } from "./constants";

interface LoopControlsPanelProps {
  maxIterations: number[];
  timeout: number[];
  retryPolicy: string;
  toolCallStrategy: string;
  onMaxIterationsChange: (value: number[]) => void;
  onTimeoutChange: (value: number[]) => void;
  onRetryPolicyChange: (value: string) => void;
  onToolCallStrategyChange: (value: string) => void;
}

export function LoopControlsPanel({
  maxIterations,
  timeout,
  retryPolicy,
  toolCallStrategy,
  onMaxIterationsChange,
  onTimeoutChange,
  onRetryPolicyChange,
  onToolCallStrategyChange,
}: LoopControlsPanelProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3.5 w-3.5 text-text-muted" />
          <span className={panelTitle}>Loop Controls</span>
        </div>
      </div>
      <div className="p-5 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-text-main">Max Iterations</Label>
              <span className="font-mono text-xs font-medium text-primary">{maxIterations[0]}</span>
            </div>
            <Slider
              value={maxIterations}
              onValueChange={onMaxIterationsChange}
              max={50}
              min={1}
              step={1}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-text-main">Timeout (s)</Label>
              <span className="font-mono text-xs font-medium text-primary">{timeout[0]}s</span>
            </div>
            <Slider
              value={timeout}
              onValueChange={onTimeoutChange}
              max={300}
              min={5}
              step={5}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-text-main">Retry Policy</Label>
            <Select value={retryPolicy} onValueChange={onRetryPolicyChange}>
              <SelectTrigger className="h-9 text-xs border-border-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No retry</SelectItem>
                <SelectItem value="fixed">Fixed delay</SelectItem>
                <SelectItem value="exponential">Exponential backoff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-text-main">Tool Call Strategy</Label>
            <Select value={toolCallStrategy} onValueChange={onToolCallStrategyChange}>
              <SelectTrigger className="h-9 text-xs border-border-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="forced">Forced</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
