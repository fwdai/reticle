import { useState, useEffect } from "react";
import { Header, type RunViewMode } from "./Header";
import { MetricsBar } from "./MetricsBar";
import { Timeline, type TraceStep } from "./Timeline";
import { Visualizer } from "./Visualizer";
import type { RunDetailRun } from "./types";
import { getExecutionById } from "@/lib/storage";
import { executionToTraceSteps, type PersistedToolCall } from "./executionToTraceSteps";

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const execution = await getExecutionById(run.id);
        if (cancelled) return;
        if (execution) {
          let toolCalls: PersistedToolCall[] | undefined;
          if (execution.tool_calls_json) {
            try {
              toolCalls = JSON.parse(execution.tool_calls_json) as PersistedToolCall[];
            } catch {
              toolCalls = undefined;
            }
          }
          const steps = executionToTraceSteps(execution, toolCalls);
          setTraceSteps(steps);
          // Expand first step + first tool_call and tool_response when present
          const initialExpanded = new Set<string>();
          if (steps[0]) initialExpanded.add(steps[0].id);
          const firstToolCall = steps.find((s) => s.type === "tool_call");
          const firstToolResp = steps.find((s) => s.type === "tool_response");
          if (firstToolCall) initialExpanded.add(firstToolCall.id);
          if (firstToolResp) initialExpanded.add(firstToolResp.id);
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
        stepCount={traceSteps.length}
        viewMode={viewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />
      {/* Execution timeline or visualizer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
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
