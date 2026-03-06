import { useState } from "react";
import { Plus, Trash2, ChevronDown, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { JsonEditorBlock } from "@/components/ui/JsonEditorBlock";
import { ImportButton } from "@/components/ui/ImportButton";
import { ExportButton } from "@/components/ui/ExportButton";
import { cn } from "@/lib/utils";
import { parseAgentImport } from "./helpers";
import { exportAgentTestCasesAsJSON, exportAgentTestCasesAsCSV } from "@/lib/evalIO";
import { AssertionTypeSelect } from "./AssertionTypeSelect";
import { JudgeModelSelect } from "./JudgeModelSelect";
import { ASSERTION_CONFIG } from "./constants";
import type { Assertion, AssertionType, TestCase } from "./types";

interface EditModeProps {
  viewMode: "table" | "json";
  cases: TestCase[];
  jsonValue: string;
  jsonError: string | null;
  onJsonChange: (v: string) => void;
  onAddCase: () => void;
  onUpdateCase: (id: string, updates: Partial<TestCase>) => void;
  onAddAssertion: (caseId: string) => void;
  onUpdateAssertion: (caseId: string, assertionId: string, updates: Partial<Assertion>) => void;
  onRemoveCase: (id: string) => void;
  onRemoveAssertion: (caseId: string, assertionId: string) => void;
  onImportCases: (cases: TestCase[]) => void;
}

export function EditMode({
  viewMode,
  cases,
  jsonValue,
  jsonError,
  onJsonChange,
  onAddCase,
  onUpdateCase,
  onAddAssertion,
  onUpdateAssertion,
  onRemoveCase,
  onRemoveAssertion,
  onImportCases,
}: EditModeProps) {
  if (viewMode === "json") {
    return (
      <div className="p-5">
        <JsonEditorBlock
          filename="agent-test-suite.json"
          metadata={`${cases.length} cases`}
          value={jsonValue}
          onChange={onJsonChange}
          error={jsonError}
          placeholder={`[\n  { "task": "Describe the task...", "assertions": [{ "type": "contains", "target": "expected", "description": "..." }] }\n]`}
        />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-end gap-4">
        <ExportButton
          filename="agent-test-suite"
          disabled={cases.length === 0}
          formats={[
            { label: "Export as JSON", extension: "json", mimeType: "application/json", serialize: () => exportAgentTestCasesAsJSON(cases) },
            { label: "Export as CSV", extension: "csv", mimeType: "text/csv", serialize: () => exportAgentTestCasesAsCSV(cases) },
          ]}
        />
        <ImportButton parse={parseAgentImport} onImport={onImportCases} />
      </div>

      {cases.map((tc, idx) => (
        <TestCaseCard
          key={tc.id}
          testCase={tc}
          index={idx}
          onUpdateTask={(task) => onUpdateCase(tc.id, { task })}
          onAddAssertion={() => onAddAssertion(tc.id)}
          onUpdateAssertion={(aId, updates) => onUpdateAssertion(tc.id, aId, updates)}
          onRemoveAssertion={(aId) => onRemoveAssertion(tc.id, aId)}
          onRemove={() => onRemoveCase(tc.id)}
        />
      ))}

      <button
        onClick={onAddCase}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-xs font-semibold text-text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all bg-transparent"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Test Case
      </button>
    </div>
  );
}

// ── Test Case Card ────────────────────────────────────────────────────

function TestCaseCard({
  testCase,
  index,
  onUpdateTask,
  onAddAssertion,
  onUpdateAssertion,
  onRemoveAssertion,
  onRemove,
}: {
  testCase: TestCase;
  index: number;
  onUpdateTask: (task: string) => void;
  onAddAssertion: () => void;
  onUpdateAssertion: (aId: string, updates: Partial<Assertion>) => void;
  onRemoveAssertion: (aId: string) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="group rounded-xl border border-border-light overflow-hidden bg-white shadow-sm">
      {/* Case header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border-light bg-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-text-muted hover:text-text-main transition-colors"
        >
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", !expanded && "-rotate-90")}
          />
        </button>
        <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
          Case {index + 1}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-text-muted">
            {testCase.assertions.length} assertion
            {testCase.assertions.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onRemove}
            className="ml-2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-destructive transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-4 bg-slate-50/30">
          {/* Task input */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Agent Task
            </label>
            <textarea
              value={testCase.task}
              onChange={(e) => onUpdateTask(e.target.value)}
              placeholder="Describe the task to give to the agent..."
              className="w-full min-h-[60px] resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-white placeholder:text-text-muted/40"
            />
          </div>

          {/* Assertions */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Assertions
            </label>
            <div className="space-y-2">
              {testCase.assertions.map((assertion) => (
                <AssertionRow
                  key={assertion.id}
                  assertion={assertion}
                  onUpdate={(updates) => onUpdateAssertion(assertion.id, updates)}
                  onRemove={() => onRemoveAssertion(assertion.id)}
                />
              ))}

              <button
                onClick={onAddAssertion}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 py-2.5 text-[11px] font-medium text-text-muted hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all bg-white"
              >
                <Plus className="h-3 w-3" />
                Add Assertion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assertion Row ─────────────────────────────────────────────────────

function AssertionRow({
  assertion,
  onUpdate,
  onRemove,
}: {
  assertion: Assertion;
  onUpdate: (updates: Partial<Assertion>) => void;
  onRemove: () => void;
}) {
  const config = ASSERTION_CONFIG[assertion.type];
  const Icon = config.icon;
  const isToolAssertion = ["tool_called", "tool_not_called", "tool_sequence"].includes(
    assertion.type
  );
  const isLlmJudge = assertion.type === "llm_judge";
  const hasDetails = !!(assertion.expectedParams || assertion.expectedReturn);
  const [showDetails, setShowDetails] = useState(hasDetails || isLlmJudge);

  return (
    <div className="group/a rounded-lg border border-slate-200 bg-slate-50 transition-all hover:border-slate-300 overflow-hidden">
      <div className="flex items-center gap-2 p-2.5">
        <div
          className={cn(
            "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200",
            config.color
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <AssertionTypeSelect
          value={assertion.type}
          onChange={(v) => onUpdate({ type: v as AssertionType })}
        />
        <Input
          value={assertion.target}
          onChange={(e) => onUpdate({ target: e.target.value })}
          placeholder={
            assertion.type === "tool_called"
              ? "tool_name"
              : assertion.type === "tool_sequence"
                ? "tool_a → tool_b → tool_c"
                : assertion.type === "loop_count"
                  ? "max loops (e.g. 5)"
                  : assertion.type === "llm_judge"
                    ? "evaluation criteria..."
                    : "expected value..."
          }
          className="h-8 flex-1 text-xs bg-white/80 border border-slate-200 rounded-md px-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 placeholder:text-text-muted/40"
        />
        {(isToolAssertion || isLlmJudge) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-all",
              showDetails || hasDetails || (isLlmJudge && assertion.judgeModel)
                ? "text-primary bg-primary/10 hover:bg-primary/15"
                : "text-text-muted/40 hover:text-text-muted hover:bg-slate-100"
            )}
            title={isToolAssertion ? "Specify expected params & return" : "Select judge model"}
          >
            <Settings2 className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="opacity-0 group-hover/a:opacity-100 text-text-muted hover:text-destructive transition-all p-1"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {isLlmJudge && showDetails && (
        <div className="border-t border-slate-200 bg-slate-100/80 px-3 py-2.5 space-y-2">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted w-[70px] flex-shrink-0">
              Judge Model
            </span>
            <JudgeModelSelect
              value={assertion.judgeModel}
              onChange={(judgeModel) => onUpdate({ judgeModel })}
            />
          </div>
        </div>
      )}
      {isToolAssertion && showDetails && (
        <div className="border-t border-slate-200 bg-slate-100/80 px-3 py-2.5 space-y-2">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted w-[70px] flex-shrink-0">
              Params
            </span>
            <textarea
              value={assertion.expectedParams || ""}
              onChange={(e) => onUpdate({ expectedParams: e.target.value })}
              placeholder='{"account_id": "ACC-4829"}'
              rows={2}
              spellCheck={false}
              className="flex-1 resize-none rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-white placeholder:text-text-muted/30"
            />
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted w-[70px] flex-shrink-0">
              Return
            </span>
            <textarea
              value={assertion.expectedReturn || ""}
              onChange={(e) => onUpdate({ expectedReturn: e.target.value })}
              placeholder='{"status": "refunded", "amount": 29.99}'
              rows={2}
              spellCheck={false}
              className="flex-1 resize-none rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 focus:bg-white placeholder:text-text-muted/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}
