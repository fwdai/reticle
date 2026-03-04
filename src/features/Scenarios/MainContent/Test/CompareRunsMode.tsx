import { useState, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EvalCaseResult {
  caseId: string;
  input: string;
  passed: boolean;
  output: string;
  latency: number;
  cost: number;
}

interface EvalRun {
  id: string;
  timestamp: Date;
  systemPrompt: string;
  results: EvalCaseResult[];
}

type DiffStatus = "regression" | "improvement" | "unchanged-pass" | "unchanged-fail";

/* ------------------------------------------------------------------ */
/*  Mock Data (UI only — persistence/real runs later)                  */
/* ------------------------------------------------------------------ */

const MOCK_RUNS: EvalRun[] = [
  {
    id: "run-5",
    timestamp: new Date("2026-03-04T14:32:00"),
    systemPrompt:
      "You are a support agent. Classify tickets into: billing, technical, account, feedback. Be concise and accurate. Always consider the user's emotional state.",
    results: [
      { caseId: "s1", input: "I was charged twice for my subscription", passed: true, output: "billing", latency: 0.82, cost: 0.0003 },
      { caseId: "s2", input: "API returns 500 on POST /users", passed: true, output: "technical", latency: 0.65, cost: 0.0002 },
      { caseId: "s3", input: "How do I reset my password?", passed: true, output: "account", latency: 0.71, cost: 0.0003 },
      { caseId: "s4", input: "Your product changed my life, thank you!", passed: true, output: "feedback", latency: 0.93, cost: 0.0004 },
      { caseId: "s5", input: "I need a refund for last month", passed: true, output: "billing", latency: 0.78, cost: 0.0003 },
      { caseId: "s6", input: "The dashboard won't load on Safari", passed: false, output: "general", latency: 1.12, cost: 0.0005 },
      { caseId: "s7", input: "Can I upgrade my plan mid-cycle?", passed: true, output: "billing", latency: 0.69, cost: 0.0003 },
      { caseId: "s8", input: "My webhook events are delayed", passed: true, output: "technical", latency: 0.88, cost: 0.0004 },
      { caseId: "s9", input: "How do I add a team member?", passed: true, output: "account", latency: 0.74, cost: 0.0003 },
      { caseId: "s10", input: "Great onboarding experience!", passed: true, output: "feedback", latency: 0.91, cost: 0.0004 },
    ],
  },
  {
    id: "run-4",
    timestamp: new Date("2026-03-04T13:15:00"),
    systemPrompt:
      "You are a support agent. Classify tickets into: billing, technical, account, feedback. Be concise and accurate.",
    results: [
      { caseId: "s1", input: "I was charged twice for my subscription", passed: true, output: "billing", latency: 0.91, cost: 0.0003 },
      { caseId: "s2", input: "API returns 500 on POST /users", passed: true, output: "technical", latency: 0.73, cost: 0.0003 },
      { caseId: "s3", input: "How do I reset my password?", passed: true, output: "account", latency: 0.82, cost: 0.0003 },
      { caseId: "s4", input: "Your product changed my life, thank you!", passed: false, output: "general", latency: 1.05, cost: 0.0005 },
      { caseId: "s5", input: "I need a refund for last month", passed: true, output: "billing", latency: 0.87, cost: 0.0003 },
      { caseId: "s6", input: "The dashboard won't load on Safari", passed: false, output: "general", latency: 1.21, cost: 0.0005 },
      { caseId: "s7", input: "Can I upgrade my plan mid-cycle?", passed: false, output: "account", latency: 0.94, cost: 0.0004 },
      { caseId: "s8", input: "My webhook events are delayed", passed: true, output: "technical", latency: 0.79, cost: 0.0003 },
      { caseId: "s9", input: "How do I add a team member?", passed: true, output: "account", latency: 0.81, cost: 0.0003 },
      { caseId: "s10", input: "Great onboarding experience!", passed: false, output: "general", latency: 1.15, cost: 0.0005 },
    ],
  },
  {
    id: "run-3",
    timestamp: new Date("2026-03-04T11:42:00"),
    systemPrompt: "Classify support tickets. Categories: billing, technical, account, feedback.",
    results: [
      { caseId: "s1", input: "I was charged twice for my subscription", passed: true, output: "billing", latency: 0.95, cost: 0.0003 },
      { caseId: "s2", input: "API returns 500 on POST /users", passed: false, output: "billing", latency: 1.32, cost: 0.0005 },
      { caseId: "s3", input: "How do I reset my password?", passed: true, output: "account", latency: 0.88, cost: 0.0003 },
      { caseId: "s4", input: "Your product changed my life, thank you!", passed: false, output: "general", latency: 1.1, cost: 0.0005 },
      { caseId: "s5", input: "I need a refund for last month", passed: true, output: "billing", latency: 0.92, cost: 0.0003 },
      { caseId: "s6", input: "The dashboard won't load on Safari", passed: false, output: "billing", latency: 1.28, cost: 0.0005 },
      { caseId: "s7", input: "Can I upgrade my plan mid-cycle?", passed: false, output: "general", latency: 1.05, cost: 0.0004 },
      { caseId: "s8", input: "My webhook events are delayed", passed: false, output: "billing", latency: 1.18, cost: 0.0005 },
      { caseId: "s9", input: "How do I add a team member?", passed: false, output: "general", latency: 1.22, cost: 0.0005 },
      { caseId: "s10", input: "Great onboarding experience!", passed: false, output: "general", latency: 1.3, cost: 0.0005 },
    ],
  },
  {
    id: "run-2",
    timestamp: new Date("2026-03-03T16:30:00"),
    systemPrompt: "You are a classifier. Respond with one word.",
    results: [
      { caseId: "s1", input: "I was charged twice for my subscription", passed: false, output: "payment", latency: 0.45, cost: 0.0002 },
      { caseId: "s2", input: "API returns 500 on POST /users", passed: false, output: "bug", latency: 0.42, cost: 0.0002 },
      { caseId: "s3", input: "How do I reset my password?", passed: false, output: "help", latency: 0.38, cost: 0.0002 },
      { caseId: "s4", input: "Your product changed my life, thank you!", passed: false, output: "praise", latency: 0.41, cost: 0.0002 },
      { caseId: "s5", input: "I need a refund for last month", passed: false, output: "payment", latency: 0.44, cost: 0.0002 },
      { caseId: "s6", input: "The dashboard won't load on Safari", passed: false, output: "bug", latency: 0.39, cost: 0.0002 },
      { caseId: "s7", input: "Can I upgrade my plan mid-cycle?", passed: false, output: "payment", latency: 0.43, cost: 0.0002 },
      { caseId: "s8", input: "My webhook events are delayed", passed: false, output: "bug", latency: 0.4, cost: 0.0002 },
      { caseId: "s9", input: "How do I add a team member?", passed: false, output: "help", latency: 0.37, cost: 0.0002 },
      { caseId: "s10", input: "Great onboarding experience!", passed: false, output: "praise", latency: 0.42, cost: 0.0002 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date) {
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CompareRunsMode() {
  const [runs] = useState<EvalRun[]>(MOCK_RUNS);
  const [selectedA, setSelectedA] = useState<string>(MOCK_RUNS[1].id);
  const [selectedB, setSelectedB] = useState<string>(MOCK_RUNS[0].id);
  const [promptDiffOpen, setPromptDiffOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "regression" | "improvement" | "unchanged">("all");

  const runA = runs.find((r) => r.id === selectedA);
  const runB = runs.find((r) => r.id === selectedB);

  const diff = useMemo(() => {
    if (!runA || !runB) return [];
    return runB.results.map((bResult) => {
      const aResult = runA.results.find((a) => a.caseId === bResult.caseId);
      const status = aResult ? getDiffStatus(aResult.passed, bResult.passed) : "unchanged-pass";
      return {
        caseId: bResult.caseId,
        input: bResult.input,
        status,
        beforePassed: aResult?.passed ?? false,
        afterPassed: bResult.passed,
        beforeOutput: aResult?.output ?? "—",
        afterOutput: bResult.output,
        beforeLatency: aResult?.latency ?? 0,
        afterLatency: bResult.latency,
      };
    });
  }, [runA, runB]);

  const filteredDiff = useMemo(() => {
    if (filterStatus === "all") return diff;
    if (filterStatus === "regression") return diff.filter((d) => d.status === "regression");
    if (filterStatus === "improvement") return diff.filter((d) => d.status === "improvement");
    return diff.filter((d) => d.status === "unchanged-pass" || d.status === "unchanged-fail");
  }, [diff, filterStatus]);

  const improvements = diff.filter((d) => d.status === "improvement").length;
  const regressions = diff.filter((d) => d.status === "regression").length;
  const passA = runA ? runA.results.filter((r) => r.passed).length : 0;
  const passB = runB ? runB.results.filter((r) => r.passed).length : 0;
  const totalCases = runB?.results.length ?? 0;

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
            const passed = run.results.filter((r) => r.passed).length;
            const total = run.results.length;
            const isA = run.id === selectedA;
            const isB = run.id === selectedB;
            const isSelected = isA || isB;

            return (
              <button
                key={run.id}
                onClick={() => {
                  if (isSelected) return;
                  setSelectedA(selectedB);
                  setSelectedB(run.id);
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
                    {formatDate(run.timestamp)} {formatTime(run.timestamp)}
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
                        width: `${(passed / total) * 100}%`,
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
                  {run.systemPrompt.slice(0, 60)}…
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

              {/* Filter */}
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
              {runA.systemPrompt !== runB.systemPrompt && (
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
                      {runA.systemPrompt}
                    </p>
                  </div>
                  <div className="p-4">
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      After
                    </span>
                    <p className="text-xs leading-relaxed text-text-main font-mono whitespace-pre-wrap">
                      {runB.systemPrompt}
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

              <div className="divide-y divide-border-light">
                {filteredDiff.map((row) => (
                  <DiffRow key={row.caseId} {...row} />
                ))}
                {filteredDiff.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <GitCompare className="mb-3 h-6 w-6 text-text-muted/30" />
                    <p className="text-sm text-text-muted">No test cases match this filter</p>
                  </div>
                )}
              </div>
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
  beforeLatency,
  afterLatency,
}: {
  input: string;
  status: DiffStatus;
  beforePassed: boolean;
  afterPassed: boolean;
  beforeOutput: string;
  afterOutput: string;
  beforeLatency: number;
  afterLatency: number;
}) {
  const borderColor =
    status === "regression"
      ? "hsl(var(--destructive))"
      : status === "improvement"
        ? "hsl(var(--success))"
        : "transparent";

  const bgClass =
    status === "regression"
      ? "bg-destructive/5"
      : status === "improvement"
        ? "bg-green-50"
        : "bg-white";

  const statusIcon =
    status === "regression" ? (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--destructive) / 0.15)" }}
      >
        <ArrowDown className="h-3 w-3 text-destructive" />
      </div>
    ) : status === "improvement" ? (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--success) / 0.15)" }}
      >
        <ArrowUp className="h-3 w-3 text-green-600" />
      </div>
    ) : status === "unchanged-pass" ? (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--success) / 0.1)" }}
      >
        <Check className="h-3 w-3 text-text-muted/40" />
      </div>
    ) : (
      <div
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: "hsl(var(--destructive) / 0.1)" }}
      >
        <X className="h-3 w-3 text-text-muted/40" />
      </div>
    );

  const latencyDelta = afterLatency - beforeLatency;

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
        {beforeOutput !== afterOutput && status !== "unchanged-pass" && status !== "unchanged-fail" && (
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
        <span className="font-mono text-[11px] text-text-muted">{afterLatency}s</span>
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
