import { ChevronRight, Copy, Trash2, Wrench } from "lucide-react";
import type { Tool } from "../types";

interface ToolListItemProps {
  tool: Tool;
  onSelect: () => void;
  onRemove: () => void;
  onCopy: () => void;
}

export function ToolListItem({ tool, onSelect, onRemove, onCopy }: ToolListItemProps) {
  return (
    <div
      onClick={onSelect}
      className="group flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-sidebar-light/50 transition-all"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <Wrench className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text-main truncate">
            {tool.name || "untitled"}
          </span>
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {tool.parameters.length} PARAM{tool.parameters.length !== 1 ? "S" : ""}
          </span>
          {tool.mockMode === "code" && (
            <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
              CODE
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted truncate">
          {tool.description || "No description"}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-main hover:bg-sidebar-light transition-all"
          title="Copy schema"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all"
          title="Delete tool"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ChevronRight className="h-4 w-4 text-text-muted/50 group-hover:text-text-muted transition-colors" />
    </div>
  );
}
