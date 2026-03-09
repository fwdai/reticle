import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import { usePersistedState } from "@/hooks/usePersistedState";
import { listAgents, agentRecordToListAgent } from "@/lib/storage";
import type { Agent } from "./MainContent/List";

export type AgentFilterId = "all" | "ready" | "needs-config" | "recently-run";

function AgentsPage() {
  const [filter, setFilter] = usePersistedState<AgentFilterId>("agents:filter", "all");
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    listAgents().then((records) => setAgents(records.map(agentRecordToListAgent)));
  }, []);

  const counts = {
    all: agents.length,
    ready: agents.filter((a) => a.status === "ready").length,
    "needs-config": agents.filter((a) => a.status === "needs-config").length,
  };

  return (
    <>
      <Sidebar filter={filter} onFilterChange={setFilter} counts={counts} />
      <MainContent filter={filter} />
    </>
  );
}

export default AgentsPage;
