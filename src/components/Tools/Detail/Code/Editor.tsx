import { useState } from "react";
import { Play, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "../../types";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { useToolExecution } from "./useToolExecution";
import { ExecutionConsole } from "./ExecutionConsole";
import { paramArgPlaceholder } from "./paramArgCoercion";

interface EditorProps {
  tool: Tool;
  onUpdate: (updates: Partial<Tool>) => void;
}

export function Editor({ tool, onUpdate }: EditorProps) {
  const {
    status,
    logs,
    testArgs,
    setTestArgs,
    argsError,
    argsErrorMessage,
    execute,
    clearLogs,
    hasNamedParameters,
    namedParameters,
    paramArgStrings,
    setParamArgValue,
  } = useToolExecution(tool);

  const [argsPanelOpen, setArgsPanelOpen] = useState(true);

  return (
    <>
      {/* Code editor */}
      <div className="p-4">
        <CodeEditor
          value={tool.code ?? ""}
          onChange={(val) => onUpdate({ code: val })}
          language="javascript"
          placeholder={`async function handler(args) {\n  // args contains the tool call arguments\n  // return any value — it will be passed back to the agent as JSON\n  return {};\n}`}
        />
      </div>

      {/* Arguments panel */}
      <div
        className={cn(
          "border-t overflow-hidden",
          argsError ? "border-red-200" : "border-border-light",
        )}
      >
        <button
          type="button"
          onClick={() => setArgsPanelOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-sidebar-light/40 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Settings2 className="h-3 w-3 text-text-muted shrink-0" />
            <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
              Arguments
            </span>
            {hasNamedParameters && (
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary shrink-0">
                {namedParameters.length}
              </span>
            )}
          </div>
          {argsPanelOpen ? (
            <ChevronDown className="h-3 w-3 text-text-muted shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
          )}
        </button>

        {argsPanelOpen && (
          <div className="border-t border-border-light px-3 py-2.5 space-y-1.5 bg-white/40">
            {hasNamedParameters ? (
              namedParameters.map((p) => (
                <div key={p.id} className="flex items-center gap-2 min-w-0">
                  <span
                    className="shrink-0 w-[100px] truncate font-mono text-[10px] font-semibold text-text-muted"
                    title={p.name}
                  >
                    {p.name}
                    {p.required ? (
                      <span className="text-red-500/80 ml-0.5" aria-hidden>
                        *
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 rounded bg-sidebar-light px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-text-muted">
                    {p.type}
                  </span>
                  <input
                    type="text"
                    value={paramArgStrings[p.name] ?? ""}
                    onChange={(e) => setParamArgValue(p.name, e.target.value)}
                    spellCheck={false}
                    placeholder={paramArgPlaceholder(p.type)}
                    className={cn(
                      "flex-1 min-w-0 rounded-md border bg-white px-2 py-1 font-mono text-[11px] text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-1 transition-colors",
                      argsError
                        ? "border-red-200 focus:ring-red-300/50 focus:border-red-300"
                        : "border-border-light focus:ring-primary/50 focus:border-primary/50",
                    )}
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase shrink-0">
                  JSON
                </span>
                <input
                  type="text"
                  value={testArgs}
                  onChange={(e) => setTestArgs(e.target.value)}
                  aria-invalid={argsError}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      void execute();
                  }}
                  placeholder="{}"
                  spellCheck={false}
                  className={cn(
                    "flex-1 rounded-md border px-2.5 py-1 font-mono text-[11px] bg-white text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors",
                    argsError
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-border-light focus:ring-primary/50 focus:border-primary/50",
                  )}
                />
              </div>
            )}
          </div>
        )}

        {argsErrorMessage ? (
          <p className="px-3 py-2 text-[11px] text-red-600 border-t border-red-200 bg-red-50/80">
            {argsErrorMessage}
          </p>
        ) : null}
      </div>

      {/* Run bar */}
      <div className="border-t border-border-light flex items-center justify-end gap-2 px-3 py-2">
        {status === "running" && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Running…
          </span>
        )}
        <button
          type="button"
          onClick={() => void execute()}
          disabled={status === "running" || !tool.code?.trim()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold tracking-wide transition-all",
            status === "running"
              ? "bg-primary/10 text-primary cursor-wait"
              : "bg-primary text-white hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          <Play className="h-3 w-3 fill-current" />
          Run
        </button>
      </div>

      {/* Console */}
      <ExecutionConsole logs={logs} status={status} onClear={clearLogs} />
    </>
  );
}
