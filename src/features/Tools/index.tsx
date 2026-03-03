import { useState } from "react";

import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

export type ToolFilterId = "all" | "json" | "code" | "unused";

function ToolsPage() {
  const [filter, setFilter] = useState<ToolFilterId>("all");

  return (
    <>
      <Sidebar filter={filter} onFilterChange={setFilter} />
      <MainContent filter={filter} />
    </>
  );
}

export default ToolsPage;
