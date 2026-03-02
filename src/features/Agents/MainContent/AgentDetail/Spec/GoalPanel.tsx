import { Sparkles } from "lucide-react";
import { PromptTextarea } from "@/components/ui/PromptBox";
import { panelBase, panelHeader, panelTitle } from "./constants";

interface GoalPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function GoalPanel({ value, onChange }: GoalPanelProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className={panelTitle}>Agent Goal</span>
        </div>
      </div>
      <PromptTextarea
        value={value}
        onChange={onChange}
        placeholder="Describe the agent's primary objective and success criteria..."
        minHeight="100px"
      />
    </div>
  );
}
