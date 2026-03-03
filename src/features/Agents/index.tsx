import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import { usePersistedState } from "@/hooks/usePersistedState";

export type AgentFilterId = "all" | "ready" | "needs-config" | "recently-run";

function AgentsPage() {
  const [filter, setFilter] = usePersistedState<AgentFilterId>("agents:filter", "all");

  return (
    <>
      <Sidebar filter={filter} onFilterChange={setFilter} />
      <MainContent filter={filter} />
    </>
  );
}

export default AgentsPage;
