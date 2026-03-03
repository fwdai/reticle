import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { usePersistedState } from '@/hooks/usePersistedState';

export type RunFilterId = "all" | "agents" | "scenarios" | "failed";

function RunsPage() {
  const [activeFilter, setActiveFilter] = usePersistedState<RunFilterId>("runs:filter", "all");

  return (
    <>
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <MainContent filter={activeFilter} />
    </>
  );
}

export default RunsPage;
