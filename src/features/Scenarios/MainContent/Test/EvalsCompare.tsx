import { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  GitCompare,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EvalRun, EvalResult } from "@/types";
import { listEvalRuns, listEvalResults } from "@/lib/storage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DiffStatus = "regression" | "improvement" | "unchanged-pass" | "unchanged-fail" | "added" | "removed";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ms: number) {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getDiffStatus(beforePassed: boolean, afterPassed: boolean): DiffStatus {
  if (beforePassed && !afterPassed) return "regression";
  if (!beforePassed && afterPassed) return "improvement";
  if (afterPassed) return "unchanged-pass";
  return "unchanged-fail";
}

function parseSystemPrompt(snapshotJson: string | null | undefined): string {
  try { return JSON.parse(snapshotJson ?? "{}").systemPrompt ?? ""; } catch { return ""; }
}

function parseInput(inputsJson: string): string {
  try { return JSON.parse(inputsJson).input ?? ""; } catch { return ""; }
}

function runTotal(run: EvalRun): number {
  return (run.pass_count ?? 0) + (run.fail_count ?? 0) + (run.error_count ?? 0);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EvalsCompare({ scenarioId }: { scenarioId: string }) {
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [resultsA, setResultsA] = useState<EvalResult[]>([]);
  const [resultsB, setResultsB] = useState<EvalResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [promptDiffOpen, setPromptDiffOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "regression" | "improvement" | "unchanged">("all");

  useEffect(() => {
    setLoadingRuns(true);
    listEvalRuns(scenarioId, "scenario").then((rows) => {
      setRuns(rows);
      if (rows.length >= 2) {
        setSelectedB(rows[0].id!);
        setSelectedA(rows[1].id!);
      }
      setLoadingRuns(false);
    });
  }, [scenarioId]);

  useEffect(() => {
    if (!selectedA || !selectedB) return;
    setLoadingResults(true);
    Promise.all([listEvalResults(selectedA), listEvalResults(selectedB)]).then(([a, b]) => {
      setResultsA(a);
      setResultsB(b);
      setLoadingResults(false);
    });
  }, [selectedA, selectedB]);

  const runA = runs.find((r) => r.id === selectedA);
  const runB = runs.find((r) => r.id === selectedB);

  const systemPromptA = useMemo(() => parseSystemPrompt(runA?.snapshot_json), [runA]);
  const systemPromptB = useMemo(() => parseSystemPrompt(runB?.snapshot_json), [runB]);

  // Match results by input content — honest when test cases are added, removed, or changed
  const diff = useMemo(() => {
    if (!runA || !runB || loadingResults) return [];

    const matchedAIds = new Set<string>();

    const rows = resultsB.map((bResult) => {
      const aResult = resultsA.find((a) => a.inputs_json === bResult.inputs_json);
      const bPassed = bResult.passed === 1;
      if (aResult) {
        matchedAIds.add(aResult.id!);
        return {
          key: bResult.id!,
          input: parseInput(bResult.inputs_json),
          status: getDiffStatus(aResult.passed === 1, bPassed),
          beforePassed: aResult.passed === 1,
          afterPassed: bPassed,
          beforeOutput: aResult.actual_output ?? "—",
          afterOutput: bResult.actual_output ?? "—",
          beforeLatencyMs: aResult.latency_ms ?? 0,
          afterLatencyMs: bResult.latency_ms ?? 0,
        };
      }
      return {
        key: bResult.id!,
        input: parseInput(bResult.inputs_json),
        status: "added" as const,
        beforePassed: false,
        afterPassed: bPassed,
        beforeOutput: "—",
        afterOutput: bResult.actual_output ?? "—",
        beforeLatencyMs: 0,
        afterLatencyMs: bResult.latency_ms ?? 0,
      };
    });

    // Results in A with no counterpart in B — test case was removed
    const removed = resultsA
      .filter((a) => !matchedAIds.has(a.id!))
      .map((aResult) => ({
        key: `removed-${aResult.id!}`,
        input: parseInput(aResult.inputs_json),
        status: "removed" as const,
        beforePassed: aResult.passed === 1,
        afterPassed: false,
        beforeOutput: aResult.actual_output ?? "—",
        afterOutput: "—",
        beforeLatencyMs: aResult.latency_ms ?? 0,
        afterLatencyMs: 0,
      }));

    return [...rows, ...removed];
  }, [runA, runB, resultsA, resultsB, loadingResults]);

  const filteredDiff = useMemo(() => {
    if (filterStatus === "all") return diff;
    if (filterStatus === "regression") return diff.filter((d) => d.status === "regression");
    if (filterStatus === "improvement") return diff.filter((d) => d.status === "improvement");
    // "unchanged" excludes added/removed — those are suite changes, not performance changes
    return diff.filter((d) => d.status === "unchanged-pass" || d.status === "unchanged-fail");
  }, [diff, filterStatus]);

  const improvements = diff.filter((d) => d.status === "improvement").length;
  const regressions = diff.filter((d) => d.status === "regression").length;
  const passA = runA?.pass_count ?? 0;
  const passB = runB?.pass_count ?? 0;
  const totalCases = runB ? runTotal(runB) : 0;

  if (loadingRuns) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-muted">
        Loading run history…
      </div>
    );
  }

  if (runs.length < 2) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <GitCompare className="mx-auto mb-3 h-8 w-8 text-text-muted/30" />
          <p className="text-sm font-medium text-text-main">No runs to compare yet</p>
          <p className="mt-1 text-xs text-text-muted">Run the test suite at least twice to compare results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Run History Sidebar */}
      <div className="w-[260px] flex-shrink-0 border-r border-border-light bg-white overflow-y-auto custom-scrollbar">
        <div className="px-4 py-3 border-b border-border-light">
          <div className="flex items-center gap-2">
            <GitCompare className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Run History</span>
          </div>
          <p className="mt-1 text-[10px] text-text-muted">Select two runs to compare</p>
        </div>

        <div className="p-2 space-y-0.5">
          {runs.map((run) => {
            const passed = run.pass_count ?? 0;
            const total = runTotal(run);
            const isA = run.id === selectedA;
            const isB = run.id === selectedB;
            const isSelected = isA || isB;

            return (
              <button
                key={run.id}
                onClick={() => {
                  if (isSelected) return;
                  setSelectedA(selectedB);
                  setSelectedB(run.id!);
                }}
                className={cn(
                  "group relative flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-all",
                  isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-slate-50 border border-transparent"
                )}
              >
                {isSelected && (
                  <span
                    className={cn(
                      "absolute right-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider",
                      isB ? "bg-primary/20 text-primary" : "bg-slate-200 text-text-muted"
                    )}
                  >
                    {isB ? "AFTER" : "BEFORE"}
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-text-muted/60" />
                  <span className="text-[11px] font-medium text-text-main">
                    {formatDate(run.started_at!)} {formatTime(run.started_at!)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      passed === total ? "text-green-600" : passed >= total * 0.7 ? "text-text-main" : "text-destructive"
                    )}
                  >
                    {passed}/{total} passed
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${total > 0 ? (passed / total) * 100 : 0}%`,
                        background:
                          passed === total
                            ? "hsl(var(--success))"
                            : passed >= total * 0.7
                              ? "var(--primary)"
                              : "hsl(var(--destructive))",
                      }}
                    />
                  </div>
                </div>

                <span className="text-[10px] text-text-muted/60 truncate leading-tight">
                  {parseSystemPrompt(run.snapshot_json).slice(0, 60)}…
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Diff Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {runA && runB ? (
          <>
            {/* Aggregate summary */}
            <div className="flex items-center gap-4 border-b border-border-light bg-white px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
                <span className="font-mono text-text-muted">{passA}/{totalCases}</span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
                <span className="font-mono">{passB}/{totalCases}</span>
              </div>
              <div className="h-4 w-px bg-border-light" />

              {improvements > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <ArrowUp className="h-3 w-3" />
                  {improvements} now passing
                </span>
              )}
              {regressions > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                  <ArrowDown className="h-3 w-3" />
                  {regressions} regression{regressions > 1 ? "s" : ""}
                </span>
              )}
              {improvements === 0 && regressions === 0 && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Minus className="h-3 w-3" />
                  No changes
                </span>
              )}

              <div className="flex-1" />

              <div className="flex items-center rounded-lg border border-border-light bg-white p-0.5">
                {(
                  [
                    { key: "all" as const, label: "All" },
                    { key: "regression" as const, label: "Regressions" },
                    { key: "improvement" as const, label: "Improvements" },
                    { key: "unchanged" as const, label: "Unchanged" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterStatus(key)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                      filterStatus === key
                        ? "bg-primary/15 text-primary shadow-sm"
                        : "text-text-muted hover:text-text-main"
                    )}
                  >
                    {label}
                    {key === "regression" && regressions > 0 && (
                      <span className="ml-1 text-[9px] text-destructive">{regressions}</span>
                    )}
                    {key === "improvement" && improvements > 0 && (
                      <span className="ml-1 text-[9px] text-green-600">{improvements}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt diff collapsible */}
            <button
              onClick={() => setPromptDiffOpen(!promptDiffOpen)}
              className="flex items-center gap-2 border-b border-border-light bg-white px-5 py-2.5 text-xs font-medium text-text-muted hover:text-text-main transition-colors"
            >
              {promptDiffOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <FileText className="h-3 w-3" />
              System Prompt Diff
              {systemPromptA !== systemPromptB && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-700">
                  CHANGED
                </span>
              )}
            </button>
            {promptDiffOpen && (
              <div className="border-b border-border-light bg-white">
                <div className="grid grid-cols-2 divide-x divide-border-light">
                  <div className="p-4">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      Before
                    </span>
                    <p className="text-xs leading-relaxed text-text-muted font-mono whitespace-pre-wrap">
                      {systemPromptA}
                    </p>
                  </div>
                  <div className="p-4">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      After
                    </span>
                    <p className="text-xs leading-relaxed text-text-main font-mono whitespace-pre-wrap">
                      {systemPromptB}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Per-case diff rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div
                className="sticky top-0 z-10 grid bg-white text-[10px] font-semibold uppercase tracking-widest text-text-muted border-b border-border-light"
                style={{ gridTemplateColumns: "36px 1fr 1fr 1fr 80px" }}
              >
                <div className="px-2 py-2" />
                <div className="px-4 py-2">Input</div>
                <div className="px-4 py-2">Before Output</div>
                <div className="px-4 py-2">After Output</div>
                <div className="px-4 py-2">Latency</div>
              </div>

              {loadingResults ? (
                <div className="flex items-center justify-center py-16 text-xs text-text-muted">
                  Loading results…
                </div>
              ) : (
                <div className="divide-y divide-border-light">
                  {filteredDiff.map((row) => {
                    const { key: rowKey, ...rest } = row;
                    return <DiffRow key={rowKey} {...rest} />;
                  })}
                  {filteredDiff.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <GitCompare className="mb-3 h-6 w-6 text-text-muted/30" />
                      <p className="text-sm text-text-muted">No test cases match this filter</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <GitCompare className="mx-auto mb-3 h-8 w-8 text-text-muted/30" />
              <p className="text-sm font-medium text-text-main">Select two runs to compare</p>
              <p className="mt-1 text-xs text-text-muted">Click entries in the run history sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Diff Row                                                           */
/* ------------------------------------------------------------------ */

function DiffRow({
  input,
  status,
  beforeOutput,
  afterOutput,
  beforeLatencyMs,
  afterLatencyMs,
}: {
  input: string;
  status: DiffStatus;
  beforePassed: boolean;
  afterPassed: boolean;
  beforeOutput: string;
  afterOutput: string;
  beforeLatencyMs: number;
  afterLatencyMs: number;
}) {
  const borderColor =
    status === "regression" ? "hsl(var(--destructive))"
    : status === "improvement" ? "hsl(var(--success))"
    : status === "added" ? "var(--primary)"
    : status === "removed" ? "transparent"
    : "transparent";

  const bgClass =
    status === "regression" ? "bg-destructive/5"
    : status === "improvement" ? "bg-green-50"
    : status === "added" ? "bg-primary/5"
    : status === "removed" ? "bg-slate-50 opacity-60"
    : "bg-white";

  const statusIcon =
    status === "regression" ? (
      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "hsl(var(--destructive) / 0.15)" }}>
        <ArrowDown className="h-3 w-3 text-destructive" />
      </div>
    ) : status === "improvement" ? (
      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "hsl(var(--success) / 0.15)" }}>
        <ArrowUp className="h-3 w-3 text-green-600" />
      </div>
    ) : status === "added" ? (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
        <Plus className="h-3 w-3 text-primary" />
      </div>
    ) : status === "removed" ? (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
        <Trash2 className="h-3 w-3 text-text-muted/40" />
      </div>
    ) : status === "unchanged-pass" ? (
      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "hsl(var(--success) / 0.1)" }}>
        <Check className="h-3 w-3 text-text-muted/40" />
      </div>
    ) : (
      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
        <X className="h-3 w-3 text-text-muted/40" />
      </div>
    );

  const afterLatency = afterLatencyMs / 1000;
  const latencyDelta = (afterLatencyMs - beforeLatencyMs) / 1000;

  return (
    <div
      className={cn("grid items-center border-l-2 transition-all", bgClass)}
      style={{
        gridTemplateColumns: "36px 1fr 1fr 1fr 80px",
        borderLeftColor: borderColor,
      }}
    >
      <div className="flex items-center justify-center px-2 py-2.5">{statusIcon}</div>

      <div className="px-4 py-2.5">
        <span className="text-xs text-text-muted truncate block">{input}</span>
      </div>

      <div className="px-4 py-2.5">
        <span
          className={cn(
            "text-xs font-mono",
            status === "improvement" ? "text-text-muted line-through" : "text-text-main"
          )}
        >
          {beforeOutput}
        </span>
      </div>

      <div className="px-4 py-2.5">
        <span
          className={cn(
            "text-xs font-mono font-medium",
            status === "regression" ? "text-destructive" : "text-text-main"
          )}
        >
          {afterOutput}
        </span>
        {status === "added" && (
          <span className="ml-2 text-[9px] font-semibold tracking-wider text-primary/70">NEW</span>
        )}
        {status === "removed" && (
          <span className="ml-2 text-[9px] font-semibold tracking-wider text-text-muted/60">REMOVED</span>
        )}
        {beforeOutput !== afterOutput && status !== "unchanged-pass" && status !== "unchanged-fail" && status !== "added" && status !== "removed" && (
          <span
            className={cn(
              "ml-2 text-[9px] font-semibold tracking-wider",
              status === "regression" ? "text-destructive/70" : "text-green-600/70"
            )}
          >
            {status === "regression" ? "REGRESSED" : "FIXED"}
          </span>
        )}
      </div>

      <div className="px-4 py-2.5">
        <span className="font-mono text-[11px] text-text-muted">{afterLatency.toFixed(2)}s</span>
        {Math.abs(latencyDelta) > 0.05 && (
          <span
            className={cn(
              "ml-1 text-[9px] font-mono",
              latencyDelta > 0 ? "text-destructive/60" : "text-green-600/60"
            )}
          >
            {latencyDelta > 0 ? "+" : ""}
            {latencyDelta.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
