import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Header, type RunViewMode } from "./Header";
import { MetricsBar } from "./MetricsBar";
import { Timeline, type TraceStep } from "./Timeline";
import { Visualizer } from "./Visualizer";
import { parseExecutionError } from "./types";
import type { RunDetailRun } from "./types";
import { getExecutionById } from "@/lib/storage";
import {
  executionToTraceSteps,
  type PersistedToolCall,
  type PersistedModelStep,
} from "./executionToTraceSteps";

export type { RunDetailRun } from "./types";

interface RunDetailProps {
  run: RunDetailRun;
  onBack: () => void;
}

export function RunDetail({ run, onBack }: RunDetailProps) {
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<RunViewMode>("timeline");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const execution = await getExecutionById(run.id);
        if (cancelled) return;
        if (execution) {
          if (execution.status === "failed") {
            setErrorMessage(parseExecutionError(execution.error_json) ?? null);
          }
          let toolCalls: PersistedToolCall[] | undefined;
          let modelSteps: PersistedModelStep[] | undefined;
          if (execution.tool_calls_json) {
            try {
              toolCalls = JSON.parse(execution.tool_calls_json) as PersistedToolCall[];
            } catch {
              toolCalls = undefined;
            }
          }
          if (execution.steps_json) {
            try {
              modelSteps = JSON.parse(execution.steps_json) as PersistedModelStep[];
            } catch {
              modelSteps = undefined;
            }
          }
          const steps = executionToTraceSteps(execution, toolCalls, modelSteps);
          setTraceSteps(steps);
          // Expand first step + first model_step and tool_call when present
          const initialExpanded = new Set<string>();
          if (steps[0]) initialExpanded.add(steps[0].id);
          const firstModelStep = steps.find((s) => s.type === "model_step");
          const firstToolCall = steps.find((s) => s.type === "tool_call");
          if (firstModelStep) initialExpanded.add(firstModelStep.id);
          if (firstToolCall) initialExpanded.add(firstToolCall.id);
          setExpandedSteps(initialExpanded);
        } else {
          setTraceSteps([]);
        }
      } catch {
        if (!cancelled) setTraceSteps([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [run.id]);

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSteps(new Set(traceSteps.map((s) => s.id)));
  const collapseAll = () => setExpandedSteps(new Set());

  const copyContent = (id: string, content: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0">
      <Header
        run={run}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBack={onBack}
      />
      <MetricsBar
        run={run}
        viewMode={viewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
      {/* Error banner for failed runs */}
      {run.status === "error" && errorMessage && (
        <div className="mx-6 mt-4 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-red-700">Run failed</p>
            <p className="mt-0.5 text-xs font-mono text-red-600 break-words">{errorMessage}</p>
          </div>
        </div>
      )}
      {/* Execution timeline or visualizer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === "timeline" ? "p-6" : "p-0"}`}
        >
          {viewMode === "timeline" ? (
            isLoading ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Loading execution…
              </div>
            ) : traceSteps.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-muted text-sm">
                Execution not found
              </div>
            ) : (
              <Timeline
                traceSteps={traceSteps}
                expandedSteps={expandedSteps}
                onToggleStep={toggleStep}
                onCopyContent={copyContent}
                copiedId={copiedId}
                provider={run.provider}
                model={run.model}
              />
            )
          ) : (
            <Visualizer run={run} />
          )}
        </div>
      </div>
    </div >
  );
}
