import { useState } from "react";
import { Check, X, Clock, Zap, ChevronDown, Coins, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSERTION_CONFIG } from "./constants";
import type { TestResult } from "./types";

interface RunModeProps {
  results: TestResult[];
  running: boolean;
  progress: number;
  validCount: number;
  passCount: number;
  failCount: number;
  totalCost: number;
  avgLatency: number;
}

export function RunMode({
  results,
  running,
  progress,
  validCount,
  passCount,
  failCount,
  totalCost,
  avgLatency,
}: RunModeProps) {
  return (
    <div className="p-5 space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border-light bg-white px-5 py-4">
        <span className="text-sm font-semibold text-text-main">
          {results.length} cases
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
          <Coins className="h-3 w-3" /> ${totalCost.toFixed(4)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3 w-3" /> {avgLatency.toFixed(1)}s avg
        </span>
        {running && (
          <>
            <div className="h-4 w-px bg-border-light" />
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Zap className="h-3 w-3 animate-pulse" />
              Running {results.length} / {validCount}
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

      {/* Result cards */}
      <div className="space-y-3">
        {results.map((result) => (
          <ResultCard key={result.caseId} result={result} />
        ))}
        {running && results.length < validCount && (
          <div className="flex items-center gap-3 rounded-xl border border-border-light bg-white p-4 animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <span className="text-xs text-text-muted">Running next test case…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────

function ResultCard({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(!result.passed);

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all",
        result.passed ? "border-border-light bg-white" : "border-destructive/30 bg-destructive/[0.02]"
      )}
    >
      {/* Result header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            result.passed ? "bg-green-100 text-green-600" : "bg-destructive/15 text-destructive"
          )}
        >
          {result.passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-main truncate">{result.task}</p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {result.assertions.filter((a) => a.passed).length}/{result.assertions.length}{" "}
            assertions passed
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
            <Clock className="h-3 w-3" />
            {result.latency}s
          </div>
          <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
            <Hash className="h-3 w-3" />
            {result.tokens}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-primary font-mono">
            <Coins className="h-3 w-3" />
            ${result.cost.toFixed(4)}
          </div>
          <span className="text-[10px] font-mono text-text-muted/50">
            {result.loops} loops
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-text-muted transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Assertion details */}
      {expanded && (
        <div className="border-t border-border-light px-5 py-3 space-y-1.5">
          {result.assertions.map((ar, i) => {
            const cfg = ASSERTION_CONFIG[ar.assertion.type];
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs",
                  ar.passed ? "bg-green-50/80" : "bg-destructive/5"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0",
                    ar.passed ? "text-green-600" : "text-destructive"
                  )}
                >
                  {ar.passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </div>
                <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", cfg.color)} />
                <span className="text-text-muted font-medium">{cfg.label}</span>
                <span className="text-text-main/60">·</span>
                <span className="text-text-main/80 truncate">
                  {ar.assertion.target || ar.assertion.description}
                </span>
                <span className="ml-auto font-mono text-[10px] flex-shrink-0">
                  <span className={ar.passed ? "text-green-600" : "text-destructive"}>
                    {ar.actual}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
