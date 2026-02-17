import { Copy } from "lucide-react";
import { panelBase, panelHeader, panelTitle } from "../constants";
import { copyToolSchema, getToolSchemaForPreview } from "../utils";
import type { Tool } from "../types";

interface SchemaPreviewProps {
  tool: Tool;
}

export function SchemaPreview({ tool }: SchemaPreviewProps) {
  const schema = getToolSchemaForPreview(tool);

  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <span className={panelTitle}>Generated Schema Preview</span>
        <button
          onClick={() => copyToolSchema(tool)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted hover:text-text-main transition-colors"
        >
          <Copy className="h-3 w-3" />
          COPY
        </button>
      </div>
      <div className="p-4">
        <pre className="overflow-x-auto text-[12px] leading-relaxed font-mono p-4 rounded-lg bg-sidebar-light/30 border border-border-light">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </div>
    </div>
  );
}
