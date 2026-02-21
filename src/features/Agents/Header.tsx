import { Plus } from "lucide-react";

import Header from "@/components/Layout/Header";
import { SearchField } from "@/components/ui/SearchField";

interface AgentsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateAgent: () => void;
  agentCount: number;
}

function AgentsHeader({
  search,
  onSearchChange,
  onCreateAgent,
  agentCount,
}: AgentsHeaderProps) {
  return (
    <Header>
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-text-main">Agents</h1>
        <span className="text-sm text-text-muted">
          {agentCount} agent{agentCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder="Search agents..."
        />
        <button
          className="h-9 px-4 rounded-lg gap-2 inline-flex items-center justify-center text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          onClick={onCreateAgent}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Agent
        </button>
      </div>
    </Header>
  );
}

export default AgentsHeader;
