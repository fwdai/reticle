import { useState, useEffect } from "react";
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { usePersistedState } from '@/hooks/usePersistedState';
import { countExecutions } from "@/lib/storage";

export type RunFilterId = "all" | "agents" | "scenarios" | "failed";

function RunsPage() {
  const [activeFilter, setActiveFilter] = usePersistedState<RunFilterId>("runs:filter", "all");
  const [counts, setCounts] = useState({ all: 0, agents: 0, scenarios: 0, failed: 0 });

  useEffect(() => {
    Promise.all([
      countExecutions(),
      countExecutions({ type: "agent" }),
      countExecutions({ type: "scenario" }),
      countExecutions({ status: "failed" }),
    ]).then(([all, agents, scenarios, failed]) => setCounts({ all, agents, scenarios, failed }));
  }, []);

  return (
    <>
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />
      <MainContent filter={activeFilter} />
    </>
  );
}

export default RunsPage;
