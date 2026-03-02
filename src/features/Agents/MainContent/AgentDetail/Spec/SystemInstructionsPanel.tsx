import { MessageSquare } from "lucide-react";
import { PromptTextarea } from "@/components/ui/PromptBox";
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
      <PromptTextarea
        value={value}
        onChange={onChange}
        placeholder="System prompt that defines the agent's behavior, constraints, and personality..."
        minHeight="240px"
      />
    </div>
  );
}
