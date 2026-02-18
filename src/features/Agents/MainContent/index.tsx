import { useState } from "react";
import { AgentDetail, type AgentDetailAgent } from "./AgentDetail";
import { AgentList, mockAgents, type Agent } from "./List";
import MainContent from "@/components/Layout/MainContent";
import Header, { type SortKey } from "../Header";

function AgentsMainContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [starredAgents, setStarredAgents] = useState<Set<string>>(
    new Set(mockAgents.filter((a) => a.starred).map((a) => a.id))
  );

  const filteredAgents = mockAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredAgents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
    const agent = mockAgents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);
  };

  const handleBackFromDetail = () => {
    setSelectedAgent(null);
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
      <AgentDetail agent={detailAgent} onBack={handleBackFromDetail} />
    );
  }

  return (
    <MainContent>
      <Header
        search={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
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
