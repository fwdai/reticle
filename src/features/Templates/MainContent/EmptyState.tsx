import { Search, Library } from "lucide-react";
import { StarterTemplates } from "@/components/ui/EmptyState";
import { FilterEmptyState } from "@/components/ui/EmptyState";
import { TEMPLATE_EMPTY_STATE } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasSearch: boolean;
  hasTemplates: boolean;
  onCreateTemplate: () => void;
}

export function EmptyState({ hasSearch, hasTemplates, onCreateTemplate }: EmptyStateProps) {
  if (hasSearch || hasTemplates) {
    return (
      <FilterEmptyState
        icon={hasSearch ? Search : Library}
        title={hasSearch ? "No templates match your search" : "No matching templates"}
        subtitle={hasSearch ? "Try a different search query." : "Try a different filter."}
      />
    );
  }

  return (
    <StarterTemplates
      {...TEMPLATE_EMPTY_STATE}
      onCreateBlank={onCreateTemplate}
      onSelect={() => onCreateTemplate()}
    />
  );
}
