import { Search } from "lucide-react";
import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { TOOL_EMPTY_STATE } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasSearch: boolean;
  hasTools: boolean;
  onCreateTool: () => void;
}

export function EmptyState({ hasSearch, hasTools, onCreateTool }: EmptyStateProps) {
  if (hasSearch || hasTools) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {hasSearch && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <Search className="h-7 w-7 text-text-muted" />
          </div>
        )}
        <p className="text-sm font-medium text-text-main mb-1">
          {hasSearch ? "No tools found" : "No matching tools"}
        </p>
        <p className="text-xs text-text-muted">
          {hasSearch ? "Try a different search query." : "Try a different filter."}
        </p>
      </div>
    );
  }

  return (
    <StarterTemplates
      {...TOOL_EMPTY_STATE}
      onCreateBlank={onCreateTool}
      onSelect={() => onCreateTool()}
    />
  );
}
