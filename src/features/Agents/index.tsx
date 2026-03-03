import { useState } from "react";

import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

export type AgentFilterId = "all" | "ready" | "needs-config" | "recently-run";

function AgentsPage() {
  const [filter, setFilter] = useState<AgentFilterId>("all");

  return (
    <>
      <Sidebar filter={filter} onFilterChange={setFilter} />
      <MainContent filter={filter} />
    </>
  );
}

export default AgentsPage;
