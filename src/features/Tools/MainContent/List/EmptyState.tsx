import { Wrench, Plus } from "lucide-react";

interface EmptyStateProps {
  hasSearch: boolean;
  onCreateTool: () => void;
}

export function EmptyState({ hasSearch, onCreateTool }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <Wrench className="h-7 w-7 text-text-muted" />
      </div>
      <p className="text-sm font-medium text-text-main mb-1">No tools found</p>
      <p className="text-xs text-text-muted mb-5 max-w-xs">
        {hasSearch
          ? "Try a different search query."
          : "Create your first shared tool to make it available across scenarios and agents."}
      </p>
      {!hasSearch && (
        <button
          className="h-9 px-5 rounded-lg gap-1.5 inline-flex items-center justify-center text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          onClick={onCreateTool}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Tool
        </button>
      )}
    </div>
  );
}
