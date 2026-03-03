import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import { usePersistedState } from "@/hooks/usePersistedState";

export type ToolFilterId = "all" | "json" | "code" | "unused";

function ToolsPage() {
  const [filter, setFilter] = usePersistedState<ToolFilterId>("tools:filter", "all");

  return (
    <>
      <Sidebar filter={filter} onFilterChange={setFilter} />
      <MainContent filter={filter} />
    </>
  );
}

export default ToolsPage;
