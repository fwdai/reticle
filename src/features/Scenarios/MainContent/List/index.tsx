import { FileText, Wrench, Variable, Copy, Download, Trash2 } from "lucide-react";

import { EntityCard, type EntityStatus } from "@/components/ui/EntityCard";
import { formatTokens } from "@/lib/helpers/format";
import { EmptyState } from "./EmptyState";
import { truncatePrompt } from "./scenarioStats";
import type { Scenario } from "@/types";
import type { ScenarioStats } from "./scenarioStats";
import type { ScenarioStatus } from "./ScenarioStatusIndicator";

function scenarioStatusToEntityStatus(status: ScenarioStatus): EntityStatus {
  return status as EntityStatus;
}

function countVariables(variablesJson: string | null | undefined): number {
  if (!variablesJson) return 0;
  try {
    const parsed = JSON.parse(variablesJson);
    const sys = Array.isArray(parsed.system) ? parsed.system.length : 0;
    const usr = Array.isArray(parsed.user) ? parsed.user.length : 0;
    return sys + usr;
  } catch {
    return 0;
  }
}

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
        <div className="space-y-1.5">
          {scenarios.map((scenario) => {
            const stats = scenario.id ? scenarioStats[scenario.id] : undefined;
            const status = scenario.id
              ? scenarioStatusMap[scenario.id] ?? "ready"
              : "ready";
            const lastRun = stats?.lastRun;
            const varsCount = countVariables(scenario.variables_json);
            const description =
              truncatePrompt(scenario.user_prompt) ||
              scenario.description ||
              "No description";

            return (
              <EntityCard
                key={scenario.id}
                icon={FileText}
                status={scenarioStatusToEntityStatus(status)}
                name={scenario.title}
                description={description}
                onClick={() => onSelectScenario(scenario.id!)}
                runnable
                onRun={() => { }}
                tags={[
                  { label: scenario.model },
                  { label: `${stats?.toolsCount ?? 0} tools`, icon: Wrench },
                  ...(varsCount > 0
                    ? [{ label: `${varsCount} vars`, icon: Variable }]
                    : []),
                ]}
                metrics={
                  lastRun
                    ? [
                      { label: "Last run", value: lastRun.timestamp },
                      { label: "Duration", value: lastRun.duration },
                      { label: "Tokens", value: formatTokens(lastRun.tokens, false) },
                      { label: "Cost", value: lastRun.cost, highlight: true },
                    ]
                    : []
                }
                menuItems={[
                  { label: "Duplicate", icon: Copy, destructive: false, onClick: () => { } },
                  { label: "Export JSON", icon: Download, destructive: false, onClick: () => { } },
                  {
                    label: "Delete",
                    icon: Trash2,
                    destructive: true,
                    onClick: () => onDeleteScenario(scenario),
                  },
                ]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
