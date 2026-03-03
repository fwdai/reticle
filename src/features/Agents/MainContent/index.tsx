import { useState, useEffect, useCallback } from "react";
import { AgentDetail, type AgentDetailAgent } from "./AgentDetail";
import { AgentList, type Agent } from "./List";
import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { listAgents, agentRecordToListAgent, listExecutions } from "@/lib/storage";
import type { AgentFilterId } from "../index";

interface AgentsMainContentProps {
  filter: AgentFilterId;
}

function AgentsMainContent({ filter }: AgentsMainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [starredAgents, setStarredAgents] = useState<Set<string>>(new Set());
  const [lastRunByAgentId, setLastRunByAgentId] = useState<Map<string, number>>(new Map());

  const refreshAgents = useCallback(async () => {
    const [records, executions] = await Promise.all([
      listAgents(),
      listExecutions({ type: "agent", limit: 1000 }),
    ]);
    setAgents(records.map(agentRecordToListAgent));

    const lastRunMap = new Map<string, number>();
    for (const exec of executions) {
      if (exec.runnable_id && exec.started_at) {
        const existing = lastRunMap.get(exec.runnable_id) ?? 0;
        if (exec.started_at > existing) lastRunMap.set(exec.runnable_id, exec.started_at);
      }
    }
    setLastRunByAgentId(lastRunMap);
  }, []);

  useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);

  const filteredAgents = (() => {
    let result = agents.filter((a) => {
      if (filter === "ready" && a.status !== "ready") return false;
      if (filter === "needs-config" && a.status !== "needs-config") return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q)
      );
    });

    if (filter === "recently-run") {
      result = [...result].sort((a, b) =>
        (lastRunByAgentId.get(b.id) ?? 0) - (lastRunByAgentId.get(a.id) ?? 0)
      );
    }

    return result;
  })();

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredAgents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    setSelectedAgent(null);
  }, [filter]);

  const handleCreateAgent = () => {
    const newAgent: Agent = {
      id: "new",
      name: "",
      description: "",
      status: "needs-config",
      model: "gpt-4.1",
      toolsCount: 0,
      memoryEnabled: false,
      starred: false,
    };
    setSelectedAgent(newAgent);
  };

  const handleSelectAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);
  };

  const handleBackFromDetail = () => {
    setSelectedAgent(null);
    refreshAgents();
  };

  if (selectedAgent) {
    const detailAgent: AgentDetailAgent = {
      id: selectedAgent.id,
      name: selectedAgent.name,
      description: selectedAgent.description,
      model: selectedAgent.model,
      toolsCount: selectedAgent.toolsCount,
      memoryEnabled: selectedAgent.memoryEnabled,
    };
    return (
      <AgentDetail
        agent={detailAgent}
        onBack={handleBackFromDetail}
        onSaved={refreshAgents}
      />
    );
  }

  return (
    <MainContent>
      <Header
        search={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateAgent={handleCreateAgent}
        agentCount={filteredAgents.length}
      />

      <AgentList
        agents={filteredAgents}
        starredAgentIds={starredAgents}
        onSelectAgent={handleSelectAgent}
        onToggleStar={toggleStar}
      />
    </MainContent>
  );
}

export default AgentsMainContent;
