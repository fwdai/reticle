import { Search } from "lucide-react";
import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { TOOL_STARTER_TEMPLATES } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasSearch: boolean;
  onCreateTool: () => void;
}

export function EmptyState({ hasSearch, onCreateTool }: EmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
          <Search className="h-7 w-7 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-main mb-1">No tools found</p>
        <p className="text-xs text-text-muted">Try a different search query.</p>
      </div>
    );
  }

  return (
    <StarterTemplates
      headline="Build your first tool"
      subtitle="Tools are shared functions that agents and scenarios can call. Choose a starting point below."
      templates={TOOL_STARTER_TEMPLATES}
      onSelect={() => onCreateTool()}
    />
  );
}
