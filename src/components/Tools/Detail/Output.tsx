import { Braces, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "../constants";
import type { Tool } from "../types";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import type { SaveStatus } from "@/components/ui/EditableTitle";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";

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
        <div onClick={(e) => e.stopPropagation()}>
          <SegmentedSwitch
            variant="default"
            size="compact"
            value={tool.mockMode ?? "json"}
            onChange={(value) => {
              onUpdate({
                mockMode: value,
                ...(value === "code" && !tool.code?.trim() && {
                  code: `async function handler(args) {\n  // args contains the tool call arguments\n  // return any value — it will be passed back to the agent as JSON\n  return {};\n}`,
                }),
              });
            }}
            options={[
              { value: "json", label: "MOCK", icon: <Braces className="h-3 w-3" /> },
              { value: "code", label: "CODE", icon: <Terminal className="h-3 w-3" /> },
            ]}
          />
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
                THIS JSON WILL BE RETURNED WHEN THE LLM CALLS THIS TOOL
              </p>
            </>
          ) : (
            <>
              <CodeEditor
                value={tool.code ?? ""}
                onChange={(val) => onUpdate({ code: val })}
                language="javascript"
                placeholder={`async function handler(args) {\n  // args contains the tool call arguments\n  // return any value — it will be passed back to the agent as JSON\n  return {};\n}`}
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
