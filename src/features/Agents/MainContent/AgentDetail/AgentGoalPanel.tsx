import { Sparkles } from "lucide-react";
import { panelBase, panelHeader, panelTitle } from "./constants";

interface AgentGoalPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function AgentGoalPanel({ value, onChange }: AgentGoalPanelProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className={panelTitle}>Agent Goal</span>
        </div>
        <span className="text-[10px] text-text-muted font-mono">{value.length} chars</span>
      </div>
      <div className="p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the agent's primary objective and success criteria..."
          className="min-h-[100px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 placeholder:text-text-muted/40"
        />
      </div>
    </div>
  );
}
