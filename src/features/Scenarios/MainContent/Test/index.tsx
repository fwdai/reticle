import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { FlaskConical, Play, Columns2, GitCompare } from "lucide-react";
import { StudioContext } from "@/contexts/StudioContext";
import {
  listEvalTestCases,
  syncEvalTestCases,
  listToolsForEntity,
  insertEvalRun,
  updateEvalRun,
  insertEvalResult,
  updateEvalResult,
} from "@/lib/storage";
import { streamText } from "@/lib/gateway";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import { EditMode } from "./EditMode";
import { RunMode } from "./RunMode";
import { ModelsCompare } from "./ModelsCompare";
import { EvalsCompare } from "./EvalsCompare";
import { createEmptyCase, dbCaseToUiCase, uiCaseToDbRow, evaluateAssertion } from "./helpers";
import { type AssertionType, type TestCase, type TestResult } from "./types";

export default function Test() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("Test must be used within a StudioProvider");

  const { studioState } = context;
  const { currentScenario, scenarioId } = studioState;

  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "json">("table");
  const [cases, setCases] = useState<TestCase[]>([]);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const runningRef = useRef(false);

  // ── DB load ──────────────────────────────────────────────────────────────────

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(false); // true immediately after a DB load

  useEffect(() => {
    // Cancel any pending save for the previous scenario before switching
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!scenarioId) {
      setCases([]);
      return;
    }

    setIsLoading(true);
    skipNextSaveRef.current = true;
    listEvalTestCases(scenarioId, "scenario")
      .then((dbCases) => setCases(dbCases.map(dbCaseToUiCase)))
      .finally(() => setIsLoading(false));
  }, [scenarioId]);

  // ── DB save (debounced, skipped on first render after load) ──────────────────

  useEffect(() => {
    if (!scenarioId) return;

    // Skip the save that would fire immediately after a DB load
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      syncEvalTestCases(scenarioId, "scenario", cases.map(uiCaseToDbRow));
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [cases, scenarioId]);

  // ── Case mutations ────────────────────────────────────────────────────────────

  const addCase = () => setCases((prev) => [...prev, createEmptyCase()]);

  const updateCase = (id: string, updates: Partial<TestCase>) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const removeCase = (id: string) =>
    setCases((prev) => prev.filter((c) => c.id !== id));

  // ── JSON view ─────────────────────────────────────────────────────────────────

  const switchToJson = () => {
    const json = cases.map(({ inputs, expected, assertion }) => ({
      inputs,
      expected,
      assertion,
    }));
    setJsonValue(JSON.stringify(json, null, 2));
    setJsonError(null);
    setViewMode("json");
  };

  const switchToTable = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      const newCases: TestCase[] = parsed.map((c: Record<string, unknown>) => ({
        id: crypto.randomUUID(),
        inputs: (c.inputs as Record<string, string>) ?? { input: "" },
        expected: String(c.expected ?? ""),
        assertion: (c.assertion as AssertionType) ?? "contains",
      }));
      setCases(newCases);
      setJsonError(null);
      setViewMode("table");
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : "Parse error");
    }
  };

  // ── Run suite ─────────────────────────────────────────────────────────────────

  const runSuite = useCallback(async () => {
    if (!scenarioId) return;

    setResults([]);
    setRunning(true);
    setProgress(0);
    runningRef.current = true;

    const { systemPrompt, configuration, history, attachments } = currentScenario;
    const allTools = await listToolsForEntity(scenarioId, "scenario");
    const total = cases.length;
    let completed = 0;
    let passCount = 0;
    let failCount = 0;
    let errorCount = 0;
    let totalLatencyMs = 0;

    // Create the eval run record
    const evalRunId = await insertEvalRun({
      runnable_id: scenarioId,
      runnable_type: "scenario",
      snapshot_json: JSON.stringify(currentScenario),
      status: "running",
      started_at: Date.now(),
    });

    for (const tc of cases) {
      if (!runningRef.current) break;

      const evalResultId = await insertEvalResult({
        eval_run_id: evalRunId,
        test_case_id: tc.id,
        sort_order: completed,
        inputs_json: JSON.stringify(tc.inputs),
        assertions_json: JSON.stringify([{ type: tc.assertion, value: tc.expected }]),
        status: "running",
      });

      const startedMs = Date.now();
      let actual = "";
      let latencyMs = 0;
      let errorMsg: string | null = null;

      try {
        const result = await streamText(
          tc.inputs.input,
          systemPrompt,
          history,
          {
            provider: configuration.provider,
            model: configuration.model,
            systemPrompt,
            temperature: configuration.temperature,
            maxTokens: configuration.maxTokens,
          },
          allTools,
          attachments,
        );

        actual = await result.text;
        latencyMs = Date.now() - startedMs;
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : "unknown";
        actual = `Error: ${errorMsg}`;
        latencyMs = Date.now() - startedMs;
      }

      if (errorMsg) {
        errorCount++;
        await updateEvalResult(evalResultId, {
          status: "error",
          actual_output: actual,
          passed: null,
          latency_ms: latencyMs,
          error: errorMsg,
        });
      } else {
        const passed = evaluateAssertion(tc.assertion, actual, tc.expected);
        passed ? passCount++ : failCount++;
        await updateEvalResult(evalResultId, {
          status: passed ? "passed" : "failed",
          actual_output: actual,
          assertions_result_json: JSON.stringify([{ type: tc.assertion, value: tc.expected, passed }]),
          passed: passed ? 1 : 0,
          latency_ms: latencyMs,
        });
      }

      totalLatencyMs += latencyMs;
      completed++;
      const uiPassed = !errorMsg && evaluateAssertion(tc.assertion, actual, tc.expected);
      setResults((prev) => [
        ...prev,
        { caseId: tc.id, passed: uiPassed, actual, latency: +(latencyMs / 1000).toFixed(2) },
      ]);
      setProgress(Math.round((completed / total) * 100));
    }

    // Finalize the eval run
    await updateEvalRun(evalRunId, {
      status: "completed",
      ended_at: Date.now(),
      pass_count: passCount,
      fail_count: failCount,
      error_count: errorCount,
      avg_latency_ms: completed > 0 ? Math.round(totalLatencyMs / completed) : null,
    });

    setRunning(false);
    runningRef.current = false;
  }, [cases, scenarioId, currentScenario]);

  useEffect(() => () => { runningRef.current = false; }, []);

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  const avgLatency = results.length
    ? results.reduce((s, r) => s + r.latency, 0) / results.length
    : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Tabs activeIndex={activeTab} onActiveIndexChange={setActiveTab}>
        <TabPanel title="Edit" icon={<FlaskConical className="h-3.5 w-3.5" />}>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-xs text-text-muted">
                Loading test cases…
              </div>
            ) : (
              <EditMode
                viewMode={viewMode}
                cases={cases}
                jsonValue={jsonValue}
                jsonError={jsonError}
                onJsonChange={(v) => { setJsonValue(v); setJsonError(null); }}
                onAddCase={addCase}
                onUpdateCase={updateCase}
                onRemoveCase={removeCase}
                onImportCases={(newCases) => setCases((prev) => [...prev, ...newCases])}
                onSwitchToTable={switchToTable}
                onSwitchToJson={switchToJson}
              />
            )}
          </div>
        </TabPanel>

        <TabPanel title="Run" icon={<Play className="h-3.5 w-3.5" />} disabled={cases.length === 0}>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100">
            <RunMode
              cases={cases}
              results={results}
              running={running}
              progress={progress}
              passCount={passCount}
              failCount={failCount}
              avgLatency={avgLatency}
              hasResults={results.length > 0}
              onRunSuite={runSuite}
            />
          </div>
        </TabPanel>

        <TabPanel title="Compare Runs" icon={<GitCompare className="h-3.5 w-3.5" />}>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100">
            <EvalsCompare scenarioId={scenarioId!} />
          </div>
        </TabPanel>

        <TabPanel title="Compare Models" icon={<Columns2 className="h-3.5 w-3.5" />}>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100">
            <ModelsCompare
              cases={cases}
              providerModels={studioState.providerModels}
            />
          </div>
        </TabPanel>
      </Tabs>

      <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-2.5">
        <span className="text-[10px] text-text-muted">
          Test mode · {currentScenario.name}
        </span>
        {!scenarioId && (
          <span className="text-[10px] text-amber-500">
            Save the scenario first to persist test cases
          </span>
        )}
      </div>
    </div>
  );
}
