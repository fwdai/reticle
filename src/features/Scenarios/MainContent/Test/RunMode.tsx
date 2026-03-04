import { Check, X, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestCase, TestResult } from "./types";

interface RunModeProps {
  cases: TestCase[];
  results: TestResult[];
  running: boolean;
  progress: number;
  passCount: number;
  failCount: number;
  avgLatency: number;
}

export function RunMode({
  cases,
  results,
  running,
  progress,
  passCount,
  failCount,
  avgLatency,
}: RunModeProps) {
  return (
    <div className="p-5 space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border-light bg-white px-5 py-4">
        <span className="text-sm font-semibold text-text-main">
          {cases.length} cases
        </span>
        <div className="h-4 w-px bg-border-light" />
        <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
          <Check className="h-3.5 w-3.5" /> {passCount} passed
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <X className="h-3.5 w-3.5" /> {failCount} failed
        </span>
        <div className="h-4 w-px bg-border-light" />
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3 w-3" /> {avgLatency.toFixed(1)}s avg
        </span>
        {running && (
          <>
            <div className="h-4 w-px bg-border-light" />
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Zap className="h-3 w-3 animate-pulse" />
              Running {results.length} / {cases.length}
            </span>
          </>
        )}
      </div>

      {/* Progress bar while running */}
      {running && (
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Results table */}
      <div className="rounded-xl border border-border-light overflow-hidden bg-white">
        {/* Header */}
        <div
          className="grid bg-slate-50 text-[10px] font-semibold uppercase tracking-widest text-text-muted"
          style={{ gridTemplateColumns: "44px 1fr 1fr 1fr 80px" }}
        >
          <div className="px-3 py-2.5" />
          <div className="px-4 py-2.5">Input</div>
          <div className="px-4 py-2.5">Expected</div>
          <div className="px-4 py-2.5">Actual</div>
          <div className="px-4 py-2.5">Latency</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border-light">
          {cases.map((tc) => {
            const result = results.find((r) => r.caseId === tc.id);
            const isFail = result && !result.passed;

            return (
              <div
                key={tc.id}
                className={cn(
                  "grid items-center transition-all",
                  isFail
                    ? "bg-destructive/5 border-l-2 border-l-destructive"
                    : "bg-white border-l-2 border-l-transparent"
                )}
                style={{ gridTemplateColumns: "44px 1fr 1fr 1fr 80px" }}
              >
                {/* Status icon */}
                <div className="flex items-center justify-center px-3 py-3">
                  {result ? (
                    result.passed ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/15">
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </div>
                    )
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border-light animate-pulse" />
                  )}
                </div>

                {/* Input (truncated) */}
                <div className="px-4 py-3">
                  <span className="text-xs text-text-muted truncate block max-w-[280px]">
                    {tc.inputs.input || "—"}
                  </span>
                </div>

                {/* Expected */}
                <div className="px-4 py-3">
                  <span className="text-sm font-medium text-text-main">
                    {tc.expected}
                  </span>
                </div>

                {/* Actual */}
                <div className="px-4 py-3">
                  {result ? (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isFail ? "text-destructive" : "text-text-main"
                      )}
                    >
                      {result.actual}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted/50">—</span>
                  )}
                </div>

                {/* Latency */}
                <div className="px-4 py-3">
                  {result ? (
                    <span className="font-mono text-xs text-text-muted">
                      {result.latency}s
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted/50">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
