import { useEffect, useRef, useState } from "react";
import { Terminal, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogEntry, ExecutionStatus } from "./useToolExecution";

interface ExecutionConsoleProps {
  logs: LogEntry[];
  status: ExecutionStatus;
  onClear: () => void;
}

function formatElapsed(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  const ms = d.getMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function formatCallArgs(args: Record<string, unknown>): string {
  const keys = Object.keys(args);
  if (keys.length === 0) return "{}";
  const inline = JSON.stringify(args);
  return inline.length <= 60 ? inline : JSON.stringify(args, null, 2);
}

export function ExecutionConsole({ logs, status, onClear }: ExecutionConsoleProps) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logs.length > 0) setOpen(true);
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const hasError = logs.some((l) => l.type === "error");
  const terminalEntry = logs.findLast(
    (e) => e.type === "result" || e.type === "error",
  );
  const lastElapsedMs =
    terminalEntry && "elapsedMs" in terminalEntry
      ? terminalEntry.elapsedMs
      : null;

  return (
    <div className="border-t border-border-light">
      {/* Console header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-sidebar-light/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3 w-3 text-text-muted" />
          <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
            Console
          </span>
          {logs.length > 0 && (
            <span className="rounded-full bg-sidebar-light px-1.5 py-0.5 text-[9px] font-bold text-text-muted">
              {logs.length}
            </span>
          )}
          {hasError && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
        </div>
        <div className="flex items-center gap-1.5">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-mono tracking-wide text-text-muted hover:text-text-main transition-colors"
            >
              clear
            </button>
          )}
          {open ? (
            <ChevronDown className="h-3 w-3 text-text-muted shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border-light">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-[#0d0d0d] text-center">
              <Terminal className="mb-2 h-4 w-4 text-[#333]" />
              <p className="text-[11px] text-[#444]">
                Click{" "}
                <span className="font-semibold text-primary/60">Run</span> to
                execute your handler
              </p>
            </div>
          ) : (
            <>
              <div
                ref={bodyRef}
                className="bg-[#0d0d0d] px-4 py-3 space-y-1.5 font-mono text-[12px] leading-relaxed max-h-72 overflow-y-auto"
              >
                {logs.map((entry, i) => {
                  switch (entry.type) {
                    case "call":
                      return (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-4 pb-1 border-b border-white/[0.04]"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-primary mt-px shrink-0 select-none">
                              ▶
                            </span>
                            <span className="text-white/40">
                              handler(
                              <span className="text-[#c5c5c5] whitespace-pre-wrap break-all">
                                {formatCallArgs(entry.args)}
                              </span>
                              )
                            </span>
                          </div>
                          <span className="text-white/35 text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                      );

                    case "stdout":
                      return (
                        <div key={i} className="flex items-start gap-2 pl-5">
                          <span className="text-[#3a3a3a] select-none shrink-0 mt-px">
                            ›
                          </span>
                          <span className="text-[#c5c5c5] whitespace-pre-wrap break-all">
                            {entry.text}
                          </span>
                        </div>
                      );

                    case "result":
                      return (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-4 pt-1 border-t border-white/[0.04]"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-success mt-px shrink-0 select-none">
                              ◀
                            </span>
                            <span className="text-success whitespace-pre-wrap break-all">
                              {formatValue(entry.value)}
                            </span>
                          </div>
                          <span className="text-white/35 text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                            {formatElapsed(entry.elapsedMs)}{" "}
                            <span className="text-success">✓</span>
                          </span>
                        </div>
                      );

                    case "error":
                      return (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-4 pt-1 border-t border-white/[0.04]"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-destructive mt-px shrink-0 select-none">
                              ✕
                            </span>
                            <span className="text-destructive/80 whitespace-pre-wrap break-all">
                              {entry.message}
                            </span>
                          </div>
                          <span className="text-white/35 text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                            {formatElapsed(entry.elapsedMs)}
                          </span>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}

                {status === "running" && (
                  <div className="flex items-center gap-2 pl-5 text-white/25">
                    <span className="animate-pulse">•</span>
                    <span>executing…</span>
                  </div>
                )}
              </div>

              {/* Status footer */}
              {lastElapsedMs !== null && (
                <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#0d0d0d] px-4 py-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      status === "success" ? "text-success" : "text-destructive",
                    )}
                  >
                    {status === "success" ? "Completed" : "Failed"}
                  </span>
                  <span className="text-white/35 text-[10px]">
                    {formatElapsed(lastElapsedMs)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
