import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { SCENARIO_EMPTY_STATE } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasCollectionSelected: boolean;
  onCreateScenario?: () => void;
}

export function EmptyState({ hasCollectionSelected, onCreateScenario }: EmptyStateProps) {
  return (
    <StarterTemplates
      {...SCENARIO_EMPTY_STATE}
      subtitle={
        hasCollectionSelected
          ? SCENARIO_EMPTY_STATE.subtitle
          : "Select or create a collection in the sidebar first, then come back here to add your first scenario."
      }
      onCreateBlank={hasCollectionSelected ? onCreateScenario : undefined}
      onSelect={() => onCreateScenario?.()}
    />
  );
}
