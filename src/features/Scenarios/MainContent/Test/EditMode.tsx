import { Plus, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonEditorBlock } from "@/components/ui/JsonEditorBlock";
import { ImportButton } from "@/components/ui/ImportButton";
import { ExportButton } from "@/components/ui/ExportButton";
import { EvalEditToolbar } from "@/components/evals/EvalEditToolbar";
import { AddCaseButton } from "@/components/evals/AddCaseButton";
import { parseScenarioImport } from "./helpers";
import { exportScenarioTestCasesAsJSON, exportScenarioTestCasesAsCSV } from "@/lib/evals";
import { AssertionDropdown } from "./AssertionDropdown";
import type { TestCase } from "./types";

interface EditModeProps {
  viewMode: "table" | "json";
  cases: TestCase[];
  jsonValue: string;
  jsonError: string | null;
  onJsonChange: (v: string) => void;
  onAddCase: () => void;
  onUpdateCase: (id: string, u: Partial<TestCase>) => void;
  onRemoveCase: (id: string) => void;
  onImportCases: (cases: TestCase[]) => void;
  onSwitchToTable: () => void;
  onSwitchToJson: () => void;
}

export function EditMode({
  viewMode,
  cases,
  jsonValue,
  jsonError,
  onJsonChange,
  onAddCase,
  onUpdateCase,
  onRemoveCase,
  onImportCases,
  onSwitchToTable,
  onSwitchToJson,
}: EditModeProps) {
  return (
    <div className="p-5 space-y-4">
      <EvalEditToolbar
        viewMode={viewMode}
        onSwitchToTable={onSwitchToTable}
        onSwitchToJson={onSwitchToJson}
      >
        <ExportButton
          filename="scenario-test-suite"
          disabled={cases.length === 0}
          formats={[
            { label: "Export as JSON", extension: "json", mimeType: "application/json", serialize: () => exportScenarioTestCasesAsJSON(cases) },
            { label: "Export as CSV", extension: "csv", mimeType: "text/csv", serialize: () => exportScenarioTestCasesAsCSV(cases) },
          ]}
        />
        <ImportButton parse={parseScenarioImport} onImport={onImportCases} />
      </EvalEditToolbar>

      {viewMode === "json" ? (
        <JsonEditorBlock
          filename="scenario-test-suite.json"
          metadata={`${cases.length} cases`}
          value={jsonValue}
          onChange={onJsonChange}
          error={jsonError}
          placeholder={`[\n  { "inputs": { "input": "Give me the weather in London" }, "expected": "sunny", "assertion": "contains" }\n]`}
        />
      ) : (
        <>
        {/* Table */}
        <div className="rounded-xl border border-border-light overflow-hidden bg-white">
        {/* Header */}
        <div
          className="grid gap-px bg-border-light"
          style={{ gridTemplateColumns: "1fr 180px 160px 40px" }}
        >
          <div className="bg-slate-50 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Input
            </span>
          </div>
          <div className="bg-slate-50 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Expected Output
            </span>
          </div>
          <div className="bg-slate-50 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Assertion
            </span>
          </div>
          <div className="bg-slate-50" />
        </div>

        {/* Rows */}
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white py-14 text-center">
            <FlaskConical className="mb-3 h-6 w-6 text-text-muted/40" />
            <p className="mb-1 text-sm font-medium text-text-main">
              No test cases yet
            </p>
            <p className="mb-4 text-xs text-text-muted">
              Add test cases to validate your workflow outputs
            </p>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-primary text-white hover:bg-primary/90 font-medium px-5"
              onClick={onAddCase}
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Test Case
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {cases.map((tc) => (
              <div
                key={tc.id}
                className="group grid gap-px bg-border-light hover:bg-primary/5 transition-colors"
                style={{ gridTemplateColumns: "1fr 180px 160px 40px" }}
              >
                <div className="bg-white px-1">
                  <input
                    type="text"
                    value={tc.inputs.input ?? ""}
                    onChange={(e) =>
                      onUpdateCase(tc.id, {
                        inputs: { ...tc.inputs, input: e.target.value },
                      })
                    }
                    className="w-full border-0 bg-transparent px-3 py-3 text-sm focus:outline-none placeholder:text-text-muted/40 text-text-main"
                    placeholder="Enter the full input that will be sent to the model…"
                  />
                </div>
                <div className="bg-white px-1">
                  <input
                    type="text"
                    value={tc.expected}
                    onChange={(e) => onUpdateCase(tc.id, { expected: e.target.value })}
                    className="w-full border-0 bg-transparent px-3 py-3 text-sm font-medium focus:outline-none placeholder:text-text-muted/40 text-text-main"
                    placeholder="expected output"
                  />
                </div>
                <div className="bg-white flex items-center px-2">
                  <AssertionDropdown
                    value={tc.assertion}
                    onChange={(v) => onUpdateCase(tc.id, { assertion: v })}
                  />
                </div>
                <div className="bg-white flex items-center justify-center">
                  <button
                    onClick={() => onRemoveCase(tc.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        {cases.length > 0 && <AddCaseButton onClick={onAddCase} />}
        </>
      )}
    </div>
  );
}
