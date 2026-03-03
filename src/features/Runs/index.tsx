import { useState } from "react";

import Sidebar from './Sidebar';
import MainContent from './MainContent';

export type RunFilterId = "all" | "agents" | "scenarios" | "failed";

function RunsPage() {
  const [activeFilter, setActiveFilter] = useState<RunFilterId>("all");

  return (
    <>
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <MainContent filter={activeFilter} />
    </>
  );
}

export default RunsPage;
