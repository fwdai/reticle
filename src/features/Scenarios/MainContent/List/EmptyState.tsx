import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { SCENARIO_STARTER_TEMPLATES } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasCollectionSelected: boolean;
  onCreateScenario?: () => void;
}

export function EmptyState({
  hasCollectionSelected,
  onCreateScenario,
}: EmptyStateProps) {
  return (
    <StarterTemplates
      headline="Add your first scenario"
      subtitle={
        hasCollectionSelected
          ? "Choose a starting point to create a test scenario, then run and compare results."
          : "Select or create a collection first, then pick a starting point below."
      }
      templates={SCENARIO_STARTER_TEMPLATES}
      onSelect={() => onCreateScenario?.()}
    />
  );
}
