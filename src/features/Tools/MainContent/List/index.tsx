import { Wrench, Braces, Zap, Copy, Trash2 } from "lucide-react";

import { EntityCard } from "@/components/ui/EntityCard";
import { formatRelativeTime } from "@/lib/helpers/time";
import { EmptyState } from "./EmptyState";
import type { ToolWithMeta } from "../../types";

interface ToolListProps {
  tools: ToolWithMeta[];
  hasTools: boolean;
  searchQuery: string;
  onSelectTool: (id: string) => void;
  onCreateTool: () => void;
  onDeleteTool: (id: string) => void;
  onCopySchema: (tool: ToolWithMeta) => void;
}

export function ToolList({
  tools,
  hasTools,
  searchQuery,
  onSelectTool,
  onCreateTool,
  onDeleteTool,
  onCopySchema,
}: ToolListProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
      {tools.length === 0 ? (
        <EmptyState hasSearch={!!searchQuery} hasTools={hasTools} onCreateTool={onCreateTool} />
      ) : (
        <div className="space-y-1.5">
          {tools.map((tool) => (
            <EntityCard
              key={tool.id}
              icon={Wrench}
              status="ready"
              name={tool.name || "untitled"}
              description={tool.description || "No description"}
              onClick={() => onSelectTool(tool.id)}
              tags={[
                { label: `${tool.parameters.length} params`, icon: Braces },
                { label: `${tool.usedBy} linked`, icon: Zap },
              ]}
              metrics={[
                { label: "Updated", value: tool.updatedAt ? formatRelativeTime(tool.updatedAt * 1000) : "—" },
              ]}
              menuItems={[
                { label: "Copy Schema", icon: Copy, destructive: false, onClick: () => onCopySchema(tool) },
                { label: "Duplicate", icon: Copy, destructive: false, onClick: () => { } },
                { label: "Delete", icon: Trash2, destructive: true, onClick: () => onDeleteTool(tool.id) },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
