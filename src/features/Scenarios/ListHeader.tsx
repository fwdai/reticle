import { Plus, Search } from "lucide-react";
import Header from "@/components/Layout/Header";

interface ListHeaderProps {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onCreateScenario: () => void;
  scenarioCount: number;
  canCreate: boolean;
}

function ListHeader({
  title,
  search,
  onSearchChange,
  onCreateScenario,
  scenarioCount,
  canCreate,
}: ListHeaderProps) {
  return (
    <Header>
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-text-main">{title}</h1>
        <span className="text-sm text-text-muted">
          {scenarioCount} scenario{scenarioCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full sm:w-72 rounded-xl border border-border-light bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <button
          className="h-9 px-4 rounded-lg gap-2 inline-flex items-center justify-center text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex-shrink-0"
          onClick={onCreateScenario}
          disabled={!canCreate}
          title={!canCreate ? "Select a collection to create a scenario" : "New Scenario"}
        >
          <Plus className="h-3.5 w-3.5" />
          New Scenario
        </button>
      </div>
    </Header>
  );
}

export default ListHeader;
