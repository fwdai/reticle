import { Braces, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "../constants";
import type { Tool } from "../types";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import type { SaveStatus } from "@/components/ui/EditableTitle";

interface OutputProps {
  tool: Tool;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Tool>) => void;
  saveStatus?: SaveStatus;
}

export function Output({
  tool,
  expanded,
  onToggle,
  onUpdate,
  saveStatus,
}: OutputProps) {
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
          <span className={panelTitle}>Tool Response</span>
          {saveStatus && <SaveIndicator status={saveStatus} />}
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
            {tool.mockMode === "json" && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
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
            {tool.mockMode === "code" && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            <Terminal className="h-3 w-3" />
            CODE
          </button>
        </div>
      </button>

      {expanded && (
        <div className="p-4">
          {tool.mockMode === "json" ? (
            <>
              <CodeEditor
                value={tool.mockResponse}
                onChange={(val) => onUpdate({ mockResponse: val })}
                placeholder='{ "result": "..." }'
              />
              <p className="mt-2 text-[10px] tracking-wide text-text-muted">
                ACTIVE — THIS JSON WILL BE RETURNED WHEN THE LLM CALLS THIS TOOL
              </p>
            </>
          ) : (
            <>
              <CodeEditor
                value={tool.code ?? ""}
                onChange={(val) => onUpdate({ code: val })}
                language="javascript"
                placeholder={`// Tool implementation\nasync function execute(params) {\n  // your code here\n  return { result: "..." };\n}`}
              />
              <p className="mt-2 text-[10px] tracking-wide text-text-muted">
                ACTIVE — THIS CODE WILL BE EXECUTED WHEN THE LLM CALLS THIS TOOL
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
