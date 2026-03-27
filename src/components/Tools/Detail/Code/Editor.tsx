import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tool } from "../../types";
import { CodeEditor } from "@/components/ui/CodeEditor";
import { useToolExecution } from "./useToolExecution";
import { ExecutionConsole } from "./ExecutionConsole";

interface CodeOutputProps {
  tool: Tool;
  onUpdate: (updates: Partial<Tool>) => void;
}

export function Editor({ tool, onUpdate }: CodeOutputProps) {
  const { status, logs, testArgs, setTestArgs, argsError, execute, clearLogs } =
    useToolExecution(tool);

  return (
    <>
      <CodeEditor
        value={tool.code ?? ""}
        onChange={(val) => onUpdate({ code: val })}
        language="javascript"
        placeholder={`async function handler(args) {\n  // args contains the tool call arguments\n  // return any value — it will be passed back to the agent as JSON\n  return {};\n}`}
      />

      {/* Test runner toolbar */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase shrink-0">
          Args
        </span>
        <input
          type="text"
          value={testArgs}
          onChange={(e) => setTestArgs(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) execute();
          }}
          placeholder="{}"
          spellCheck={false}
          className={cn(
            "flex-1 rounded-md border px-2.5 py-1 font-mono text-[11px] bg-white text-text-main placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors",
            argsError
              ? "border-red-300 ring-1 ring-red-300"
              : "border-border-light focus:ring-primary/50 focus:border-primary/50"
          )}
        />
        <button
          onClick={execute}
          disabled={status === "running" || !tool.code?.trim()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-semibold tracking-wide transition-all shrink-0",
            status === "running"
              ? "bg-primary/10 text-primary cursor-wait"
              : "bg-primary text-white hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {status === "running" ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Running
            </>
          ) : (
            <>
              <Play className="h-3 w-3 fill-current" />
              Run
            </>
          )}
        </button>
      </div>

      <ExecutionConsole logs={logs} status={status} onClear={clearLogs} />
    </>
  );
}
