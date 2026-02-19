import { FileText } from "lucide-react";

interface EmptyStateProps {
  hasCollectionSelected: boolean;
}

export function EmptyState({ hasCollectionSelected }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <FileText className="h-7 w-7 text-text-muted" />
      </div>
      <p className="text-sm font-medium text-text-main mb-1">
        {hasCollectionSelected ? "No scenarios in this collection" : "No scenarios yet"}
      </p>
      <p className="text-xs text-text-muted">
        {hasCollectionSelected
          ? "Create a new scenario using the button above"
          : "Select a collection or create one to add scenarios"}
      </p>
    </div>
  );
}
