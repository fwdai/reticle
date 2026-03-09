import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import { usePersistedState } from "@/hooks/usePersistedState";
import { listSharedToolsWithMeta } from "@/lib/storage";
import type { ToolWithMeta } from "./types";

export type ToolFilterId = "all" | "json" | "code" | "unused";

function ToolsPage() {
  const [filter, setFilter] = usePersistedState<ToolFilterId>("tools:filter", "all");
  const [tools, setTools] = useState<ToolWithMeta[]>([]);

  useEffect(() => {
    listSharedToolsWithMeta().then(setTools);
  }, []);

  const counts = {
    all: tools.length,
    json: tools.filter((t) => t.mockMode === "json").length,
    code: tools.filter((t) => t.mockMode === "code").length,
    unused: tools.filter((t) => t.usedBy === 0).length,
  };

  return (
    <>
      <Sidebar filter={filter} onFilterChange={setFilter} counts={counts} />
      <MainContent filter={filter} />
    </>
  );
}

export default ToolsPage;
