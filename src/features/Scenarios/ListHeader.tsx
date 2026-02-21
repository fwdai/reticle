import { Plus } from "lucide-react";
import Header from "@/components/Layout/Header";
import { SearchField } from "@/components/ui/SearchField";

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
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder="Search scenarios..."
        />
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
