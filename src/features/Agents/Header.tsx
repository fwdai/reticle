import { Plus, Search } from "lucide-react";

import Header from "@/components/Layout/Header";
import { NativeSelect } from "@/components/ui/native-select";

export type SortKey = "updated" | "cost" | "latency" | "loops" | "success";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "updated", label: "Last updated" },
  { key: "cost", label: "Avg cost" },
  { key: "latency", label: "Avg latency" },
  { key: "loops", label: "Loops" },
  { key: "success", label: "Success rate" },
];

interface AgentsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortKey;
  onSortChange: (key: SortKey) => void;
  onCreateAgent: () => void;
  agentCount: number;
}

function AgentsHeader({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
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
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search agents by name, description, model..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full sm:w-72 rounded-xl border border-border-light bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <NativeSelect
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="h-10 w-auto min-w-[11rem]"
        >
          {sortOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
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
