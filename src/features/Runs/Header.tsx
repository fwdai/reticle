import { Search, X } from "lucide-react";

import Header from "@/components/Layout/Header";

interface RunsHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  totalExecutions: number;
}

function formatExecutionCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function RunsHeader({ searchQuery, onSearchQueryChange, totalExecutions }: RunsHeaderProps) {
  return (
    <Header>
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-text-main">Runs History</h1>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="size-2 bg-primary rounded-full animate-pulse"></span>
          <span className="text-[11px] font-medium text-slate-600">
            Total:
          </span>
          <span className="text-xs font-semibold tabular-nums text-slate-700">{formatExecutionCount(totalExecutions)}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
        <div className="relative flex-1 sm:flex-none min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
          <input
            className="pl-10 pr-10 py-2 bg-slate-50 border border-border-light rounded-xl text-sm w-full sm:w-80 focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="Search scenario, ID, or model..."
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </Header>
  );
}

export default RunsHeader;
