import { Search } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <Search className="h-7 w-7 text-text-muted" />
      </div>
      <p className="text-sm font-medium text-text-main mb-1">No agents found</p>
      <p className="text-xs text-text-muted">Try a different search term or create a new agent</p>
    </div>
  );
}
