import { Wrench, Braces, Zap, Clock } from "lucide-react";
import type { RegistryTool } from "../../types";

interface ToolCardProps {
  tool: RegistryTool;
  onSelect: () => void;
}

export function ToolCard({ tool, onSelect }: ToolCardProps) {
  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col rounded-xl border border-border-light bg-white shadow-sm p-5 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Wrench className="h-4.5 w-4.5" />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-text-muted">
          {tool.category}
        </span>
      </div>

      <h3 className="mb-1.5 font-mono text-sm font-bold text-text-main group-hover:text-primary transition-colors">
        {tool.name || "untitled"}
      </h3>
      <p className="mb-4 text-xs text-text-muted leading-relaxed line-clamp-2">
        {tool.description || "No description"}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-border-light pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Braces className="h-3 w-3" />
            {tool.parameters.length} params
          </span>
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Zap className="h-3 w-3" />
            {tool.usedBy} agents
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-text-muted">
          <Clock className="h-2.5 w-2.5" />
          {tool.updatedAt}
        </span>
      </div>
    </div>
  );
}
