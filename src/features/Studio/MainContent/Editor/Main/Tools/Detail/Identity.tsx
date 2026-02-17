import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle, inputBase } from "../constants";
import type { Tool } from "../types";

interface IdentityProps {
  tool: Tool;
  onUpdate: (updates: Partial<Tool>) => void;
}

export function Identity({ tool, onUpdate }: IdentityProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <span className={panelTitle}>Identity</span>
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
      </div>
    </div>
  );
}
