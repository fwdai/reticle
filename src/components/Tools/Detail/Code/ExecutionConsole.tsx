import { useEffect, useRef } from "react";
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
  // Inline for simple args, multiline for complex ones
  const inline = JSON.stringify(args);
  return inline.length <= 60 ? inline : JSON.stringify(args, null, 2);
}

export function ExecutionConsole({ logs, status, onClear }: ExecutionConsoleProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  if (logs.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-white/5 shadow-xl">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[10px] font-mono tracking-widest text-[#555] uppercase select-none">
            console
          </span>
          {status === "running" && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <button
          onClick={onClear}
          className="text-[10px] font-mono tracking-wide text-[#444] hover:text-[#888] transition-colors uppercase"
        >
          clear
        </button>
      </div>

      {/* Output area */}
      <div ref={bodyRef} className="bg-[#0d0d0d] px-4 py-3 space-y-1.5 font-mono text-[12px] leading-relaxed max-h-72 overflow-y-auto">
        {logs.map((entry, i) => {
          switch (entry.type) {
            case "call":
              return (
                <div key={i} className="flex items-start justify-between gap-4 pb-1 border-b border-white/[0.04]">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[#4d9de0] mt-px shrink-0 select-none">▶</span>
                    <span className="text-[#888]">
                      handler(
                      <span className="text-[#c5c5c5] whitespace-pre-wrap break-all">
                        {formatCallArgs(entry.args)}
                      </span>
                      )
                    </span>
                  </div>
                  <span className="text-[#3a3a3a] text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              );

            case "stdout":
              return (
                <div key={i} className="flex items-start gap-2 pl-5">
                  <span className="text-[#3a3a3a] select-none shrink-0 mt-px">›</span>
                  <span className="text-[#c5c5c5] whitespace-pre-wrap break-all">{entry.text}</span>
                </div>
              );

            case "result":
              return (
                <div key={i} className="flex items-start justify-between gap-4 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[#3ddc84] mt-px shrink-0 select-none">◀</span>
                    <span className="text-[#3ddc84] whitespace-pre-wrap break-all">
                      {formatValue(entry.value)}
                    </span>
                  </div>
                  <span className="text-[#3a3a3a] text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                    {formatElapsed(entry.elapsedMs)}{" "}
                    <span className="text-[#28c840]">✓</span>
                  </span>
                </div>
              );

            case "error":
              return (
                <div key={i} className="flex items-start justify-between gap-4 pt-1 border-t border-white/[0.04]">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[#ff5f57] mt-px shrink-0 select-none">✕</span>
                    <span className="text-[#ff8080] whitespace-pre-wrap break-all">{entry.message}</span>
                  </div>
                  <span className="text-[#3a3a3a] text-[10px] whitespace-nowrap shrink-0 mt-0.5">
                    {formatElapsed(entry.elapsedMs)}
                  </span>
                </div>
              );

            default:
              return null;
          }
        })}

        {status === "running" && (
          <div className="flex items-center gap-2 pl-5 text-[#444]">
            <span className="animate-pulse">•</span>
            <span>executing…</span>
          </div>
        )}

      </div>
    </div>
  );
}
