import { ToolCard } from "./ToolCard";
import { EmptyState } from "./EmptyState";
import type { RegistryTool } from "../../types";

interface ToolListProps {
  tools: RegistryTool[];
  searchQuery: string;
  onSelectTool: (id: string) => void;
  onCreateTool: () => void;
}

export function ToolList({
  tools,
  searchQuery,
  onSelectTool,
  onCreateTool,
}: ToolListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
      {tools.length === 0 ? (
        <EmptyState hasSearch={!!searchQuery} onCreateTool={onCreateTool} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onSelect={() => onSelectTool(tool.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
