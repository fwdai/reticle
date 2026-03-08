import { DatabaseZap, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "../constants";

interface MemoryPanelProps {
  enabled: boolean;
  source: string;
  onEnabledChange: (enabled: boolean) => void;
  onSourceChange: (source: string) => void;
}

export function MemoryPanel({
  enabled,
  source,
  onEnabledChange,
  onSourceChange,
}: MemoryPanelProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-3.5 w-3.5 text-text-muted" />
          <span className={panelTitle}>Memory</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-text-muted/60 hover:text-text-muted cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-[240px]">
                <p className="leading-relaxed">
                  Memory allows the agent to persist context across runs. The agent can store
                  observations, user preferences, and prior decisions to improve subsequent
                  interactions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              enabled ? "left-4" : "left-0.5"
            )}
          />
        </button>
      </div>
      {enabled && (
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-text-main">Memory Source</Label>
            <Select value={source} onValueChange={onSourceChange}>
              <SelectTrigger className="h-9 text-xs border-border-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local Store</SelectItem>
                <SelectItem value="vector" disabled>
                  Vector DB (coming soon)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border-light bg-slate-50 p-3">
            <p className="text-xs text-text-muted leading-relaxed">
              Memory is automatically disabled during eval runs to keep test results deterministic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
