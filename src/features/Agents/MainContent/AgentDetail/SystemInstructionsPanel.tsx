import { MessageSquare } from "lucide-react";
import { panelBase, panelHeader, panelTitle } from "./constants";

interface SystemInstructionsPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function SystemInstructionsPanel({ value, onChange }: SystemInstructionsPanelProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
          <span className={panelTitle}>System Instructions</span>
        </div>
      </div>
      <div className="p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="System prompt that defines the agent's behavior, constraints, and personality..."
          className="min-h-[120px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 placeholder:text-text-muted/40"
        />
      </div>
    </div>
  );
}
