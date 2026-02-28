import { Braces, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "../constants";
import { ParamRow } from "../ParamRow";
import type { Tool, ToolParameter } from "../types";

interface InputProps {
  tool: Tool;
  expanded: boolean;
  onToggle: () => void;
  onAddParam: () => void;
  onUpdateParam: (paramId: string, updates: Partial<ToolParameter>) => void;
  onRemoveParam: (paramId: string) => void;
}

export function Input({
  tool,
  expanded,
  onToggle,
  onAddParam,
  onUpdateParam,
  onRemoveParam,
}: InputProps) {
  return (
    <div className={panelBase}>
      <button
        onClick={onToggle}
        className={cn(
          panelHeader,
          "w-full cursor-pointer hover:bg-sidebar-light/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          )}
          <span className={panelTitle}>Input Parameters</span>
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {tool.parameters.length}
          </span>
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onAddParam();
          }}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          ADD
        </span>
      </button>

      {expanded && (
        <div className="p-4">
          {tool.parameters.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Braces className="mb-2 h-5 w-5 text-text-muted/50" />
              <p className="mb-1 text-xs text-text-muted">No parameters defined</p>
              <p className="mb-4 text-[11px] text-text-muted/70">
                Add input parameters this tool expects from the LLM
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={onAddParam}
              >
                <Plus className="h-3 w-3" />
                Add Parameter
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tool.parameters.map((param) => (
                <ParamRow
                  key={param.id}
                  param={param}
                  onUpdate={(updates) => onUpdateParam(param.id, updates)}
                  onRemove={() => onRemoveParam(param.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
