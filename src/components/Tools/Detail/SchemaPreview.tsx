import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "../constants";
import { copyToolSchema, getToolSchemaForPreview } from "../utils";
import type { Tool } from "../types";
import { CodeEditor } from "@/components/ui/CodeEditor";

interface SchemaPreviewProps {
  tool: Tool;
  expanded: boolean;
  onToggle: () => void;
}

export function SchemaPreview({ tool, expanded, onToggle }: SchemaPreviewProps) {
  const schema = getToolSchemaForPreview(tool);

  return (
    <div className={panelBase}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          panelHeader,
          !expanded && "border-b-0",
          "w-full cursor-pointer hover:bg-sidebar-light/50 transition-colors",
        )}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          )}
          <span className={panelTitle}>Generated Schema Preview</span>
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            copyToolSchema(tool);
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted hover:text-text-main transition-colors cursor-pointer"
        >
          <Copy className="h-3 w-3" />
          COPY
        </span>
      </button>
      {expanded && (
        <div className="p-4">
          <CodeEditor
            value={JSON.stringify(schema, null, 2)}
            onChange={() => {}}
            readOnly
            minHeight="100px"
          />
        </div>
      )}
    </div>
  );
}
