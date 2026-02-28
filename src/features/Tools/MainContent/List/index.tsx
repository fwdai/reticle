import { ToolCard } from "./ToolCard";
import { EmptyState } from "./EmptyState";
import type { RegistryTool } from "../../types";

interface ToolListProps {
  tools: RegistryTool[];
  searchQuery: string;
  onSelectTool: (id: string) => void;
  onCreateTool: () => void;
  onDeleteTool: (id: string) => void;
  onCopySchema: (tool: RegistryTool) => void;
}

export function ToolList({
  tools,
  searchQuery,
  onSelectTool,
  onCreateTool,
  onDeleteTool,
  onCopySchema,
}: ToolListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
      {tools.length === 0 ? (
        <EmptyState hasSearch={!!searchQuery} onCreateTool={onCreateTool} />
      ) : (
        <div className="space-y-2">
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onSelect={() => onSelectTool(tool.id)}
              onDelete={(e) => {
                e.stopPropagation();
                onDeleteTool(tool.id);
              }}
              onCopySchema={(e) => {
                e.stopPropagation();
                onCopySchema(tool);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
