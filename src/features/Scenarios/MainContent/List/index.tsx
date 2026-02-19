import { ScenarioCard } from "./ScenarioCard";
import { EmptyState } from "./EmptyState";
import { truncatePrompt } from "./scenarioStats";
import type { Scenario } from "@/types";
import type { ScenarioStats } from "./scenarioStats";
import type { ScenarioStatus } from "./ScenarioStatusIndicator";

interface ScenarioListProps {
  scenarios: Scenario[];
  collectionNames: Record<string, string>;
  scenarioStats: Record<string, ScenarioStats>;
  scenarioStatusMap: Record<string, ScenarioStatus>;
  onSelectScenario: (id: string) => void;
  onDeleteScenario: (scenario: Scenario) => void;
  hasCollectionSelected: boolean;
}

export function ScenarioList({
  scenarios,
  collectionNames,
  scenarioStats,
  scenarioStatusMap,
  onSelectScenario,
  onDeleteScenario,
  hasCollectionSelected,
}: ScenarioListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
      {scenarios.length === 0 ? (
        <EmptyState hasCollectionSelected={hasCollectionSelected} />
      ) : (
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              collectionName={collectionNames[scenario.collection_id]}
              stats={scenario.id ? scenarioStats[scenario.id] : undefined}
              status={scenario.id ? scenarioStatusMap[scenario.id] ?? "ready" : "ready"}
              userPromptHint={truncatePrompt(scenario.user_prompt)}
              onSelect={() => onSelectScenario(scenario.id!)}
              onDelete={() => onDeleteScenario(scenario)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
