import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { AGENT_EMPTY_STATE } from "@/constants/starterTemplates";

interface EmptyStateProps {
  onCreateAgent?: () => void;
}

export function EmptyState({ onCreateAgent }: EmptyStateProps) {
  return (
    <StarterTemplates
      {...AGENT_EMPTY_STATE}
      onCreateBlank={onCreateAgent}
      onSelect={() => onCreateAgent?.()}
    />
  );
}
