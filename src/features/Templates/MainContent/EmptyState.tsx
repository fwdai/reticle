import { Search } from "lucide-react";
import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { TEMPLATE_STARTER_TEMPLATES } from "@/constants/starterTemplates";

interface EmptyStateProps {
  hasSearch: boolean;
  onCreateTemplate: () => void;
}

export function EmptyState({ hasSearch, onCreateTemplate }: EmptyStateProps) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
          <Search className="h-7 w-7 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-main mb-1">No templates match your search</p>
        <p className="text-xs text-text-muted">Try a different search query.</p>
      </div>
    );
  }

  return (
    <StarterTemplates
      headline="Create your first template"
      subtitle="Reusable prompt templates keep your prompts consistent and easy to iterate on."
      templates={TEMPLATE_STARTER_TEMPLATES}
      onSelect={() => onCreateTemplate()}
    />
  );
}
