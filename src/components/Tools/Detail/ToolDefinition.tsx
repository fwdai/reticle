import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle, inputBase } from "../constants";
import type { Tool } from "../types";

interface ToolDefinitionProps {
  tool: Tool;
  showSharedToggle?: boolean;
  autoFocusName?: boolean;
  onUpdate: (updates: Partial<Tool>) => void;
}

export function ToolDefinition({
  tool,
  showSharedToggle = false,
  autoFocusName = false,
  onUpdate,
}: ToolDefinitionProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <span className={panelTitle}>Tool Definition</span>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Function Name
          </label>
          <input
            type="text"
            value={tool.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g. get_weather, search_docs"
            className={cn(inputBase, "font-mono")}
            autoFocus={autoFocusName}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Description
          </label>
          <textarea
            value={tool.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe what this tool does. The LLM uses this to decide when to call it."
            rows={2}
            className={cn(inputBase, "resize-none leading-relaxed")}
          />
        </div>
        {showSharedToggle && (
          <div className="flex items-center justify-between rounded-lg border border-border-light bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Globe className="h-3.5 w-3.5 text-text-muted" />
              <div>
                <p className="text-xs font-semibold text-text-main">
                  Shared tool
                </p>
                <p className="text-[10px] text-text-muted">
                  Available to all scenarios and agents
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={tool.isShared ?? false}
              onClick={() => onUpdate({ isShared: !(tool.isShared ?? false) })}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors flex-shrink-0",
                tool.isShared ? "bg-primary" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                  tool.isShared ? "left-4" : "left-0.5"
                )}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
