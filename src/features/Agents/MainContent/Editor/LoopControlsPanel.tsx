import { RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "./constants";
import { useAgentSpecContext } from "@/contexts/AgentSpecContext";

export function LoopControlsPanel() {
  const {
    maxIterations,
    timeoutValue,
    retryPolicy,
    toolCallStrategy,
    humanInTheLoop,
    setMaxIterations,
    setTimeoutValue,
    setRetryPolicy,
    setToolCallStrategy,
    setHumanInTheLoop,
  } = useAgentSpecContext();

  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3.5 w-3.5 text-text-muted" />
          <span className={panelTitle}>Loop Controls</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">Human in the loop</span>
          <button
            role="switch"
            aria-checked={humanInTheLoop}
            onClick={() => setHumanInTheLoop(!humanInTheLoop)}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              humanInTheLoop ? "bg-primary" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                humanInTheLoop ? "left-4" : "left-0.5"
              )}
            />
          </button>
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
              onValueChange={setMaxIterations}
              max={50}
              min={1}
              step={1}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-text-main">Timeout (s)</Label>
              <span className="font-mono text-xs font-medium text-primary">{timeoutValue[0]}s</span>
            </div>
            <Slider
              value={timeoutValue}
              onValueChange={setTimeoutValue}
              max={300}
              min={5}
              step={5}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-text-main">Retry Policy</Label>
            <Select value={retryPolicy} onValueChange={setRetryPolicy}>
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
            <Select value={toolCallStrategy} onValueChange={setToolCallStrategy}>
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
