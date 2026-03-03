import { useState, useCallback, useEffect, useRef, useMemo, useContext } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import { Subheader } from "./Subheader";
import { EditMode } from "./EditMode";
import { RunMode } from "./RunMode";
import { createEmptyCase, SEED_CASES } from "./helpers";
import { DEFAULT_VARIABLES, type AssertionType, type TestCase, type TestResult } from "./types";

export default function Test() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("Test must be used within a StudioProvider");
  }

  const { studioState } = context;
  const { currentScenario } = studioState;

  const variables = useMemo(() => {
    const keys = currentScenario.userVariables
      ?.map((v) => v.key?.trim())
      .filter(Boolean);
    return keys && keys.length > 0 ? keys : DEFAULT_VARIABLES;
  }, [currentScenario.userVariables]);

  const [innerMode, setInnerMode] = useState<"edit" | "run">("edit");
  const [viewMode, setViewMode] = useState<"table" | "json">("table");
  const [cases, setCases] = useState<TestCase[]>(SEED_CASES);
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const runningRef = useRef(false);

  useEffect(() => {
    setCases((prev) =>
      prev.map((c) => ({
        ...c,
        inputs: Object.fromEntries(
          variables.map((v) => [v, c.inputs[v] ?? ""])
        ),
      }))
    );
  }, [variables.join(",")]);

  const addCase = () => setCases((prev) => [...prev, createEmptyCase(variables)]);

  const updateCase = (id: string, updates: Partial<TestCase>) =>
    setCases((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const updateInput = (id: string, key: string, value: string) =>
    setCases((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, inputs: { ...c.inputs, [key]: value } } : c
      )
    );

  const removeCase = (id: string) => setCases((prev) => prev.filter((c) => c.id !== id));

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
        inputs: (c.inputs as Record<string, string>) ?? {},
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

  const runSuite = useCallback(() => {
    setResults([]);
    setRunning(true);
    setProgress(0);
    setInnerMode("run");
    runningRef.current = true;

    const total = cases.length;
    let completed = 0;
    const MOCK_OUTPUTS = ["billing", "technical", "account", "general", "feedback"];

    cases.forEach((tc, i) => {
      setTimeout(() => {
        if (!runningRef.current) return;
        const actual = MOCK_OUTPUTS[i % MOCK_OUTPUTS.length];
        let passed = false;
        switch (tc.assertion) {
          case "exact":
            passed = actual === tc.expected;
            break;
          case "contains":
            passed = actual.includes(tc.expected) || tc.expected.includes(actual);
            break;
          case "json_schema":
          case "llm_judge":
            passed = Math.random() > 0.3;
            break;
        }

        const result: TestResult = {
          caseId: tc.id,
          passed,
          actual,
          latency: +(0.4 + Math.random() * 2.2).toFixed(2),
          cost: +(0.0002 + Math.random() * 0.001).toFixed(4),
        };

        completed++;
        setResults((prev) => [...prev, result]);
        setProgress(Math.round((completed / total) * 100));

        if (completed === total) {
          setRunning(false);
          runningRef.current = false;
        }
      }, 400 + i * 350);
    });
  }, [cases]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  const totalCost = results.reduce((s, r) => s + r.cost, 0);
  const avgLatency =
    results.length
      ? results.reduce((s, r) => s + r.latency, 0) / results.length
      : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <Subheader
        innerMode={innerMode}
        viewMode={viewMode}
        casesCount={cases.length}
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
            variables={variables}
            jsonValue={jsonValue}
            jsonError={jsonError}
            onJsonChange={(v) => {
              setJsonValue(v);
              setJsonError(null);
            }}
            onAddCase={addCase}
            onUpdateCase={updateCase}
            onUpdateInput={updateInput}
            onRemoveCase={removeCase}
          />
        ) : (
          <RunMode
            cases={cases}
            results={results}
            running={running}
            progress={progress}
            passCount={passCount}
            failCount={failCount}
            totalCost={totalCost}
            avgLatency={avgLatency}
          />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-2.5">
        <span className="text-[10px] text-text-muted">
          Test mode · {currentScenario.name}
        </span>
      </div>
    </div>
  );
}
