import { AgentCard } from "./AgentCard";
import { EmptyState } from "./EmptyState";
import type { Agent } from "./types";

interface AgentListProps {
  agents: Agent[];
  starredAgentIds: Set<string>;
  onSelectAgent: (agentId: string) => void;
  onToggleStar: (agentId: string, e: React.MouseEvent) => void;
}

export function AgentList({
  agents,
  starredAgentIds,
  onSelectAgent,
  onToggleStar,
}: AgentListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
      {agents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isStarred={starredAgentIds.has(agent.id)}
              onSelect={() => onSelectAgent(agent.id)}
              onToggleStar={(e) => onToggleStar(agent.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { mockAgents } from "./constants";
export type { Agent, AgentStatus } from "./types";
