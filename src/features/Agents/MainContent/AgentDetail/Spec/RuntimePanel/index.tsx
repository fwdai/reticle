import { useState, useRef } from "react";
import { Header } from "./Header";
import { Prompt } from "./Prompt";
import { ExecutionTimeline } from "./ExecutionTimeline";
import { mockExecution } from "./constants";
import { useExecutionAnimation } from "./useExecutionAnimation";
import { useAgentContext } from "@/contexts/AgentContext";
import type { StepType } from "./types";

export type { ExecutionStatus } from "./types";

export function RuntimePanel() {
  const { execution } = useAgentContext();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StepType | "all">("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { stepPhases, lineProgress } = useExecutionAnimation(
    execution.status,
    filter,
    scrollRef
  );

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyContent = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const totalTokens = mockExecution.reduce((a, s) => a + (s.tokens || 0), 0);
  const totalCost = mockExecution.reduce(
    (a, s) => a + parseFloat((s.cost || "$0").replace("$", "")),
    0
  );
  const totalLoops = Math.max(...mockExecution.map((s) => s.loop || 0));

  return (
    <section className="h-full flex flex-col overflow-hidden rounded-b-xl">
      <Header
        status={execution.status}
        elapsedSeconds={execution.elapsedSeconds}
        tokens={execution.tokens}
        cost={execution.cost}
        totalTokens={totalTokens}
        totalCost={totalCost}
        totalLoops={totalLoops}
        stepCount={mockExecution.length}
      />

      <Prompt />

      <ExecutionTimeline
        ref={scrollRef}
        status={execution.status}
        filter={filter}
        onFilterChange={setFilter}
        expandedSteps={expandedSteps}
        onToggleStep={toggleStep}
        copiedId={copiedId}
        onCopy={copyContent}
        stepPhases={stepPhases}
        lineProgress={lineProgress}
        hasPrompt
      />
    </section>
  );
}
