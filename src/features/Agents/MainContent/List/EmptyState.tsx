import { StarterTemplates } from "@/components/ui/EmptyState";
import { AGENT_EMPTY_STATE } from "@/constants/starterTemplates";
import type { AgentStarterConfig } from "@/constants/starterTemplates";

interface EmptyStateProps {
  onCreateAgent?: (config?: AgentStarterConfig) => void;
}

export function EmptyState({ onCreateAgent }: EmptyStateProps) {
  return (
    <StarterTemplates
      {...AGENT_EMPTY_STATE}
      onCreateBlank={() => onCreateAgent?.()}
      onSelect={(i) => onCreateAgent?.(AGENT_EMPTY_STATE.templates[i].config)}
    />
  );
}
