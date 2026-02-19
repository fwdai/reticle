import { Braces, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle, inputBase } from "../constants";
import type { Tool } from "../types";

interface MockOutputProps {
  tool: Tool;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Tool>) => void;
}

export function MockOutput({
  tool,
  expanded,
  onToggle,
  onUpdate,
}: MockOutputProps) {
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
          <span className={panelTitle}>Tool Response Mock</span>
        </div>
        <div className="flex items-center rounded-lg border border-border-light bg-white p-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ mockMode: "json" });
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
              tool.mockMode === "json"
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-text-muted hover:text-text-main"
            )}
          >
            <Braces className="h-3 w-3" />
            MOCK
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ mockMode: "code" });
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
              tool.mockMode === "code"
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-text-muted hover:text-text-main"
            )}
          >
            <Terminal className="h-3 w-3" />
            CODE
          </button>
        </div>
      </button>

      {expanded && (
        <div className="p-4">
          {tool.mockMode === "json" ? (
            <>
              <textarea
                value={tool.mockResponse}
                onChange={(e) => onUpdate({ mockResponse: e.target.value })}
                spellCheck={false}
                rows={8}
                className={cn(
                  inputBase,
                  "font-mono text-[13px] leading-relaxed p-4 resize-none focus:border-primary/50"
                )}
                placeholder='{ "result": "..." }'
              />
              <p className="mt-2 text-[10px] tracking-wide text-text-muted">
                THIS JSON WILL BE RETURNED WHEN THE LLM CALLS THIS TOOL DURING A TEST RUN
              </p>
            </>
          ) : (
            <>
              <textarea
                value={tool.mockResponse}
                onChange={(e) => onUpdate({ mockResponse: e.target.value })}
                spellCheck={false}
                rows={10}
                className={cn(
                  inputBase,
                  "font-mono text-[13px] leading-relaxed p-4 resize-none focus:border-primary/50"
                )}
                placeholder={`// Tool implementation\nasync function execute(params) {\n  // your code here\n  return { result: "..." };\n}`}
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  COMING SOON
                </span>
                <p className="text-[10px] tracking-wide text-text-muted">
                  CODE MODE WILL EXECUTE JS SNIPPETS AS TOOL IMPLEMENTATIONS
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
