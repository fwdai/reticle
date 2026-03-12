import { Layers } from "lucide-react";
import { StarterTemplates, FilterEmptyState } from "@/components/ui/EmptyState";
import { SCENARIO_EMPTY_STATE } from "@/constants/starterTemplates";
import type { ScenarioStarterConfig } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasCollectionSelected: boolean;
  hasScenarios: boolean;
  hasSearch: boolean;
  onCreateScenario?: (config?: ScenarioStarterConfig) => void;
}

export function EmptyState({ hasCollectionSelected, hasScenarios, hasSearch, onCreateScenario }: EmptyStateProps) {
  if (hasScenarios || hasSearch) {
    return (
      <FilterEmptyState
        icon={Layers}
        title={hasSearch ? "No scenarios match your search" : "No matching scenarios"}
        subtitle={hasSearch ? "Try a different search query." : "Try a different filter."}
      />
    );
  }

  return (
    <StarterTemplates
      {...SCENARIO_EMPTY_STATE}
      onCreateBlank={() => onCreateScenario?.()}
      onSelect={(i) => onCreateScenario?.(SCENARIO_EMPTY_STATE.templates[i].config)}
    />
  );
}
