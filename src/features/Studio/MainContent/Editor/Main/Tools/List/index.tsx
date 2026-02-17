import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { panelBase, panelHeader, panelTitle } from "../constants";
import { ToolListItem } from "./Item";
import type { Tool } from "../types";

interface ToolsListProps {
  tools: Tool[];
  onAddTool: () => void;
  onSelectTool: (id: string) => void;
  onRemoveTool: (id: string) => void;
  onCopySchema: (tool: Tool) => void;
}

export function ToolsList({
  tools,
  onAddTool,
  onSelectTool,
  onRemoveTool,
  onCopySchema,
}: ToolsListProps) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className={panelBase}>
        <div className={panelHeader}>
          <span className={panelTitle}>Tool Definitions</span>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
              {tools.length} TOOL{tools.length !== 1 ? "S" : ""}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10"
              onClick={onAddTool}
            >
              <Plus className="h-3 w-3" />
              ADD TOOL
            </Button>
          </div>
        </div>

        {tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <p className="mb-1 text-sm font-medium text-text-main">No tools configured</p>
            <p className="mb-5 max-w-[260px] text-xs text-text-muted">
              Define function calling tools for the LLM. Specify input schema and mock
              outputs to test tool calling behavior.
            </p>
            <Button
              size="sm"
              className="h-9 gap-1.5 font-medium px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm"
              onClick={onAddTool}
            >
              <Plus className="h-3.5 w-3.5" />
              Create First Tool
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {tools.map((tool) => (
              <ToolListItem
                key={tool.id}
                tool={tool}
                onSelect={() => onSelectTool(tool.id)}
                onRemove={() => onRemoveTool(tool.id)}
                onCopy={() => onCopySchema(tool)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
