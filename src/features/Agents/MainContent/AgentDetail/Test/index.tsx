import { useState, useCallback, useRef, useEffect } from "react";
import { streamText, stepCountIs } from "ai";
import { createModel } from "@/lib/gateway";
import { toolConfigToAiSdkTools } from "@/lib/gateway/helpers";
import {
  getAgentById,
  listToolsForEntity,
  listEvalTestCases,
  replaceEvalTestCases,
  insertEvalRun,
  updateEvalRun,
  insertEvalResult,
  updateEvalResult,
} from "@/lib/storage";
import { calculateRequestCost } from "@/lib/modelPricing";
import { Subheader } from "./Subheader";
import { EditMode } from "./EditMode";
import { RunMode } from "./RunMode";
import { createEmptyCase, createEmptyAssertion, evaluateAgentAssertion, dbCaseToAgentCase, agentCaseToDbRow } from "./helpers";
import type { Assertion, AssertionType, TestCase, TestResult } from "./types";

interface TestViewProps {
  agentId: string | null;
  agentName: string;
}

export function TestView({ agentId, agentName }: TestViewProps) {
  const [innerMode, setInnerMode] = useState<"edit" | "run">("edit");
  const [viewMode, setViewMode] = useState<"table" | "json">("table");
  const [cases, setCases] = useState<TestCase[]>([]);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const runningRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(false);

  // ── DB load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!agentId) {
      setCases([]);
      return;
    }
    skipNextSaveRef.current = true;
    listEvalTestCases(agentId, "agent")
      .then((dbCases) => setCases(dbCases.map(dbCaseToAgentCase)));
  }, [agentId]);

  // ── DB save (debounced) ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!agentId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      replaceEvalTestCases(agentId, "agent", cases.map(agentCaseToDbRow));
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [cases, agentId]);

  const validCount = cases.filter(
    (c) => c.task.trim() && c.assertions.length > 0
  ).length;

  // ── Case mutations ───────────────────────────────────────────────────

  const addCase = () => setCases((prev) => [...prev, createEmptyCase()]);

  const updateCase = useCallback((id: string, updates: Partial<TestCase>) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const removeCase = (id: string) =>
    setCases((prev) => prev.filter((c) => c.id !== id));

  const importCases = (newCases: TestCase[]) =>
    setCases((prev) => [...prev, ...newCases]);

  const addAssertion = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, assertions: [...c.assertions, createEmptyAssertion()] }
          : c
      )
    );
  };

  const updateAssertion = (
    caseId: string,
    assertionId: string,
    updates: Partial<Assertion>
  ) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              assertions: c.assertions.map((a) =>
                a.id === assertionId ? { ...a, ...updates } : a
              ),
            }
          : c
      )
    );
  };

  const removeAssertion = (caseId: string, assertionId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? { ...c, assertions: c.assertions.filter((a) => a.id !== assertionId) }
          : c
      )
    );
  };

  // ── JSON view sync ──────────────────────────────────────────────────

  const switchToJson = () => {
    const json = cases.map((c) => ({
      task: c.task,
      assertions: c.assertions.map((a) => {
        const base: Record<string, string> = {
          type: a.type,
          target: a.target,
          description: a.description,
        };
        if (a.expectedParams) base.expectedParams = a.expectedParams;
        if (a.expectedReturn) base.expectedReturn = a.expectedReturn;
        return base;
      }),
    }));
    setJsonValue(JSON.stringify(json, null, 2));
    setJsonError(null);
    setViewMode("json");
  };

  const switchToTable = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      if (!Array.isArray(parsed)) throw new Error("Must be an array");
      const newCases: TestCase[] = parsed.map((c: Record<string, unknown>, i: number) => ({
        id: `tc-${i}-${Date.now()}`,
        task: String(c.task ?? ""),
        assertions: ((c.assertions as Record<string, unknown>[]) ?? []).map(
          (a: Record<string, unknown>, j: number) => ({
            id: `a-${i}-${j}-${Date.now()}`,
            type: (a.type as AssertionType) ?? "contains",
            target: String(a.target ?? ""),
            description: String(a.description ?? ""),
            expectedParams: a.expectedParams ? String(a.expectedParams) : undefined,
            expectedReturn: a.expectedReturn ? String(a.expectedReturn) : undefined,
          })
        ),
      }));
      setCases(newCases);
      setJsonError(null);
      setViewMode("table");
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : "Parse error");
    }
  };

  const handleJsonChange = (v: string) => {
    setJsonValue(v);
    setJsonError(null);
  };

  // ── Run suite ────────────────────────────────────────────────────────

  const runSuite = useCallback(async () => {
    if (!agentId) return;

    const agentRecord = await getAgentById(agentId);
    if (!agentRecord) return;

    const validCases = cases.filter((c) => c.task.trim() && c.assertions.length > 0);
    if (validCases.length === 0) return;

    setResults([]);
    setRunning(true);
    setProgress(0);
    setInnerMode("run");
    runningRef.current = true;

    const params = agentRecord.params_json ? JSON.parse(agentRecord.params_json) : {};
    const instructions =
      [agentRecord.agent_goal, agentRecord.system_instructions]
        .filter(Boolean)
        .join("\n\n") || undefined;

    const linkedTools = await listToolsForEntity(agentId, "agent");
    const aiTools = toolConfigToAiSdkTools(linkedTools);
    const hasTools = Object.keys(aiTools).length > 0;

    const total = validCases.length;
    let completed = 0;
    let passCount = 0;
    let failCount = 0;
    let errorCount = 0;
    let totalLatencyMs = 0;

    const evalRunId = await insertEvalRun({
      runnable_id: agentId,
      runnable_type: "agent",
      snapshot_json: JSON.stringify({
        name: agentRecord.name,
        provider: agentRecord.provider,
        model: agentRecord.model,
      }),
      status: "running",
      started_at: Date.now(),
    });

    for (const tc of validCases) {
      if (!runningRef.current) break;

      const evalResultId = await insertEvalResult({
        eval_run_id: evalRunId,
        test_case_id: null,
        sort_order: completed,
        inputs_json: JSON.stringify({ task: tc.task }),
        assertions_json: JSON.stringify(tc.assertions.map((a) => ({ type: a.type, target: a.target }))),
        status: "running",
      });

      const startedMs = Date.now();
      let finalText = "";
      const calledToolNames: string[] = [];
      let loopCount = 0;
      let totalTokens = 0;
      let inputTokens = 0;
      let outputTokens = 0;
      let errorMsg: string | null = null;

      try {
        const result = streamText({
          model: createModel({ provider: agentRecord.provider, model: agentRecord.model }),
          ...(instructions ? { system: instructions } : {}),
          prompt: tc.task,
          ...(hasTools ? { tools: aiTools } : {}),
          stopWhen: stepCountIs(agentRecord.max_iterations ?? 10),
          temperature: params.temperature,
          topP: params.top_p,
          maxOutputTokens: params.max_tokens,
        });

        for await (const chunk of result.fullStream) {
          if (!runningRef.current) break;
          switch (chunk.type) {
            case "start-step":
              loopCount++;
              break;
            case "tool-call":
              calledToolNames.push(chunk.toolName);
              break;
            case "finish-step": {
              const u = chunk.usage;
              if (u) {
                inputTokens += u.inputTokens ?? 0;
                outputTokens += u.outputTokens ?? 0;
                totalTokens += u.totalTokens ?? (inputTokens + outputTokens);
              }
              break;
            }
            case "error":
              throw new Error(
                chunk.error instanceof Error ? chunk.error.message : String(chunk.error)
              );
          }
        }

        finalText = await result.text;
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : "unknown";
      }

      const latencyMs = Date.now() - startedMs;
      totalLatencyMs += latencyMs;

      if (errorMsg) {
        errorCount++;
        await updateEvalResult(evalResultId, {
          status: "error",
          actual_output: `Error: ${errorMsg}`,
          passed: null,
          latency_ms: latencyMs,
          error: errorMsg,
        });
        setResults((prev) => [
          ...prev,
          {
            caseId: tc.id,
            task: tc.task,
            assertions: tc.assertions.map((a) => ({
              assertion: a,
              passed: false,
              actual: `Error: ${errorMsg}`,
            })),
            loops: loopCount,
            tokens: totalTokens,
            cost: 0,
            latency: latencyMs / 1000,
            passed: false,
          },
        ]);
      } else {
        const assertionResults = tc.assertions.map((a) =>
          evaluateAgentAssertion(a, finalText, calledToolNames, loopCount)
        );
        const casePassed = assertionResults.every((r) => r.passed);
        casePassed ? passCount++ : failCount++;

        const cost =
          calculateRequestCost(agentRecord.provider, agentRecord.model, {
            inputTokens,
            outputTokens,
          }) ?? 0;

        await updateEvalResult(evalResultId, {
          status: casePassed ? "passed" : "failed",
          actual_output: finalText,
          assertions_result_json: JSON.stringify(
            assertionResults.map((r) => ({
              type: r.assertion.type,
              target: r.assertion.target,
              passed: r.passed,
              actual: r.actual,
            }))
          ),
          passed: casePassed ? 1 : 0,
          latency_ms: latencyMs,
        });

        setResults((prev) => [
          ...prev,
          {
            caseId: tc.id,
            task: tc.task,
            assertions: assertionResults,
            loops: loopCount,
            tokens: totalTokens,
            cost,
            latency: latencyMs / 1000,
            passed: casePassed,
          },
        ]);
      }

      completed++;
      setProgress(Math.round((completed / total) * 100));
    }

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
  }, [agentId, cases]);

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  const totalCost = results.reduce((s, r) => s + r.cost, 0);
  const avgLatency =
    results.length > 0
      ? results.reduce((s, r) => s + r.latency, 0) / results.length
      : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <Subheader
        innerMode={innerMode}
        viewMode={viewMode}
        casesCount={cases.length}
        validCount={validCount}
        running={running}
        onBackToEdit={() => setInnerMode("edit")}
        onRunSuite={runSuite}
        onSwitchToTable={switchToTable}
        onSwitchToJson={switchToJson}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {innerMode === "edit" ? (
          <EditMode
            viewMode={viewMode}
            cases={cases}
            jsonValue={jsonValue}
            jsonError={jsonError}
            onJsonChange={handleJsonChange}
            onAddCase={addCase}
            onUpdateCase={updateCase}
            onAddAssertion={addAssertion}
            onUpdateAssertion={updateAssertion}
            onRemoveCase={removeCase}
            onRemoveAssertion={removeAssertion}
            onImportCases={importCases}
          />
        ) : (
          <RunMode
            results={results}
            running={running}
            progress={progress}
            validCount={validCount}
            passCount={passCount}
            failCount={failCount}
            totalCost={totalCost}
            avgLatency={avgLatency}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border-light bg-slate-50 px-6 py-2.5">
        <span className="text-[10px] text-text-muted">
          Test mode · {agentName}
        </span>
        {!agentId && (
          <span className="text-[10px] text-amber-500">
            Save the agent first to run tests
          </span>
        )}
      </div>
    </div>
  );
}
