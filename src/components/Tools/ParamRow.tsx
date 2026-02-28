import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PARAM_TYPES } from "./constants";
import type { ToolParameter } from "./types";

interface ParamRowProps {
  param: ToolParameter;
  onUpdate: (updates: Partial<ToolParameter>) => void;
  onRemove: () => void;
}

export function ParamRow({ param, onUpdate, onRemove }: ParamRowProps) {
  return (
    <div className="group rounded-xl border border-border-light bg-slate-50 p-3 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2.5">
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
        <Select
          value={param.type}
          onValueChange={(val) =>
            onUpdate({ type: val as ToolParameter["type"] })
          }
        >
          <SelectTrigger className="w-[110px] h-auto py-2 px-3 text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PARAM_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => onUpdate({ required: !param.required })}
          className={cn(
            "rounded-lg border px-2.5 py-2 text-[10px] font-bold tracking-wide transition-all",
            param.required
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border-light bg-white text-text-muted hover:text-text-main"
          )}
        >
          {param.required ? "REQUIRED" : "OPTIONAL"}
        </button>
        <button
          onClick={onRemove}
          className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={param.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Parameter description (helps the LLM understand usage)"
        className="mt-2.5 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-xs text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:text-text-main transition-all"
      />
    </div>
  );
}
