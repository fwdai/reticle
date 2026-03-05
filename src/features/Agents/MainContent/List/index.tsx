import { Zap, Wrench, Brain, Copy, Trash2 } from "lucide-react";

import { EntityCard } from "@/components/ui/EntityCard";
import { formatRelativeTime } from "@/lib/helpers/time";
import { EmptyState } from "./EmptyState";
import type { Agent } from "./types";

export interface AgentLastRun {
  timestamp: number;
  duration: string;
  tokens: string;
  cost: string;
}

interface AgentListProps {
  agents: Agent[];
  starredAgentIds: Set<string>;
  lastRunByAgentId: Map<string, AgentLastRun>;
  onSelectAgent: (agentId: string) => void;
  onToggleStar: (agentId: string, e: React.MouseEvent) => void;
}

export function AgentList({
  agents,
  starredAgentIds,
  lastRunByAgentId,
  onSelectAgent,
  onToggleStar,
}: AgentListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
      {agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-1.5">
          {agents.map((agent) => {
            const lastRun = lastRunByAgentId.get(agent.id);

            return (
              <EntityCard
                key={agent.id}
                icon={Zap}
                status={agent.status}
                name={agent.name}
                description={agent.description}
                onClick={() => onSelectAgent(agent.id)}
                starred={starredAgentIds.has(agent.id)}
                onToggleStar={(e) => onToggleStar(agent.id, e)}
                onRun={() => { }}
                tags={[
                  { label: agent.model },
                  { label: `${agent.toolsCount} tools`, icon: Wrench },
                  ...(agent.memoryEnabled
                    ? [{ label: "Memory on", icon: Brain, accent: true }]
                    : []),
                ]}
                metrics={
                  lastRun
                    ? [
                      { label: "Last run", value: formatRelativeTime(lastRun.timestamp) },
                      { label: "Duration", value: lastRun.duration },
                      { label: "Tokens", value: lastRun.tokens },
                      { label: "Cost", value: lastRun.cost, highlight: true },
                    ]
                    : []
                }
                menuItems={[
                  { label: "Duplicate", icon: Copy, destructive: false, onClick: () => { } },
                  { label: "Delete", icon: Trash2, destructive: true, onClick: () => { } },
                ]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export { mockAgents } from "./constants";
export type { Agent, AgentStatus } from "./types";
