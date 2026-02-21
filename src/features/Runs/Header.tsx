import Header from "@/components/Layout/Header";
import { SearchField } from "@/components/ui/SearchField";

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
        <SearchField
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Search scenario, ID, or model..."
        />
      </div>
    </Header>
  );
}

export default RunsHeader;
