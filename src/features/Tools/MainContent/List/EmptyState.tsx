import { Search, Wrench } from "lucide-react";
import { StarterTemplates } from "@/components/ui/EmptyState";
import { FilterEmptyState } from "@/components/ui/EmptyState";
import { TOOL_EMPTY_STATE } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasSearch: boolean;
  hasTools: boolean;
  onCreateTool: () => void;
}

export function EmptyState({ hasSearch, hasTools, onCreateTool }: EmptyStateProps) {
  if (hasSearch || hasTools) {
    return (
      <FilterEmptyState
        icon={hasSearch ? Search : Wrench}
        title={hasSearch ? "No tools found" : "No matching tools"}
        subtitle={hasSearch ? "Try a different search query." : "Try a different filter."}
      />
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
