import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PARAM_TYPES } from "./constants";
import type { ToolParameter } from "./types";

interface ParamRowProps {
  param: ToolParameter;
  onUpdate: (updates: Partial<ToolParameter>) => void;
  onRemove: () => void;
}

export function ParamRow({ param, onUpdate, onRemove }: ParamRowProps) {
  return (
    <div className="group rounded-xl border border-border-light bg-white p-3 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="text"
            value={param.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="param_name"
            className="w-[140px] rounded-lg border border-border-light bg-white px-3 py-2 font-mono text-xs focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <select
            value={param.type}
            onChange={(e) => onUpdate({ type: e.target.value as ToolParameter["type"] })}
            className="rounded-lg border border-border-light bg-white px-3 py-2 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          >
            {PARAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => onUpdate({ required: !param.required })}
            className={cn(
              "rounded-lg border px-3 py-2 text-[10px] font-bold tracking-wide transition-all",
              param.required
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border-light bg-white text-text-muted hover:text-text-main"
            )}
          >
            {param.required ? "REQUIRED" : "OPTIONAL"}
          </button>
        </div>
        <button
          onClick={onRemove}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={param.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Parameter description (helps the LLM understand usage)"
        className="mt-2 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-xs text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:text-text-main transition-all"
      />
    </div>
  );
}
