import { useRef } from "react";
import { Braces, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "../constants";
import type { Tool } from "../types";
import { CodeEditor as JsonOutput } from "@/components/ui/CodeEditor";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import type { SaveStatus } from "@/components/ui/EditableTitle";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { Editor as CodeEditor } from "./Code/Editor";

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const { overflowY } = window.getComputedStyle(el);
  if (overflowY === "auto" || overflowY === "scroll") return el;
  return getScrollParent(el.parentElement);
}

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
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={panelRef} className={panelBase}>
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
              const container = getScrollParent(panelRef.current);
              const savedScrollTop = container?.scrollTop ?? 0;
              onUpdate({
                mockMode: value,
                ...(value === "code" &&
                  !tool.code?.trim() && {
                  code: `async function handler(args) {\n  // args contains the tool call arguments\n  // return any value — it will be passed back to the agent as JSON\n  return {};\n}`,
                }),
              });
              // Restore after React re-renders and the new CodeMirror instance mounts
              requestAnimationFrame(() =>
                requestAnimationFrame(() => {
                  if (container) container.scrollTop = savedScrollTop;
                })
              );
            }}
            options={[
              {
                value: "json",
                label: "MOCK",
                icon: <Braces className="h-3 w-3" />,
              },
              {
                value: "code",
                label: "CODE",
                icon: <Terminal className="h-3 w-3" />,
              },
            ]}
          />
        </div>
      </button>

      {expanded && (
        <div className="p-4">
          {tool.mockMode === "json" ? (
            <>
              <JsonOutput
                value={tool.mockResponse}
                onChange={(val) => onUpdate({ mockResponse: val })}
                placeholder='{ "result": "..." }'
              />
              <p className="mt-2 text-[10px] tracking-wide text-text-muted">
                THIS JSON WILL BE RETURNED WHEN THE LLM CALLS THIS TOOL
              </p>
            </>
          ) : (
            <CodeEditor tool={tool} onUpdate={onUpdate} />
          )}
        </div>
      )}
    </div>
  );
}
