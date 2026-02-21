import { Plus } from "lucide-react";

import Header from "@/components/Layout/Header";
import { SearchField } from "@/components/ui/SearchField";

interface TemplatesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateTemplate: () => void;
  templateCount: number;
}

function TemplatesHeader({ search, onSearchChange, onCreateTemplate, templateCount }: TemplatesHeaderProps) {
  return (
    <Header>
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-text-main">Prompt Templates</h1>
        <span className="text-sm text-text-muted">
          {templateCount} template{templateCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder="Search templates..."
        />
        <button
          className="h-9 px-4 rounded-lg gap-2 inline-flex items-center justify-center text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
          onClick={onCreateTemplate}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Template
        </button>
      </div>
    </Header>
  );
}

export default TemplatesHeader;
