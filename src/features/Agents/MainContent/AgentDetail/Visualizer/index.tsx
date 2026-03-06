import { AgentFlowCanvas } from "./AgentFlowCanvas";
import { AgentMetricsBar } from "./AgentMetricsBar";
import { BottomBar } from "@/components/Visualizer";
import { useAgentContext } from "@/contexts/AgentContext";

export interface VisualizerViewProps {
  agentName: string;
  provider: string;
  model: string;
  agentGoal: string;
  systemInstructions: string;
  maxIterations: number;
  memoryEnabled: boolean;
  memorySource: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

function computeNodeStats(
  execution: { status: string; steps: { type: string }[] } | undefined
) {
  const hasExecution = execution && execution.steps.length > 0;
  const isRunning = execution?.status === "running";
  const isSuccess = execution?.status === "success";
  const isError = execution?.status === "error";
  const isCancelled = execution?.status === "cancelled";
  const status: "active" | "idle" | "success" | "error" =
    isRunning ? "active" : isSuccess ? "success" : isError || isCancelled ? "error" : "idle";

  const memoryStep = hasExecution ? execution.steps.find((s) => s.type === "memory_read") : null;
  const toolCalls = hasExecution
    ? execution.steps.filter((s) => s.type === "tool_call" || s.type === "tool_response")
    : [];
  const outputStep = hasExecution ? execution.steps.find((s) => s.type === "output") : null;

  type NodeStatus = "active" | "idle" | "success" | "error";
  const nodeStatuses: NodeStatus[] = [
    hasExecution ? status : "idle",
    hasExecution ? status : "idle",
    hasExecution ? status : "idle",
    memoryStep ? status : "idle",
    ...(toolCalls.length > 0
      ? (toolCalls.slice(0, 6).map(() => status) as NodeStatus[])
      : (["idle"] as NodeStatus[])),
    outputStep ? status : "idle",
  ];

  const total = nodeStatuses.length;
  const active = nodeStatuses.filter((s) => s === "active").length;
  const error = nodeStatuses.filter((s) => s === "error").length;
  const idle = total - active - error;

  return { total, active, idle, error };
}

export function VisualizerView({
  agentName: _agentName,
  provider,
  model,
  agentGoal,
  systemInstructions,
  maxIterations,
  memoryEnabled,
  memorySource,
  temperature,
  topP,
  maxTokens,
}: VisualizerViewProps) {
  const { execution } = useAgentContext();
  const nodeStats = computeNodeStats(execution);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <AgentMetricsBar />
      <AgentFlowCanvas
        provider={provider}
        model={model}
        agentGoal={agentGoal}
        systemInstructions={systemInstructions}
        maxIterations={maxIterations}
        memoryEnabled={memoryEnabled}
        memorySource={memorySource}
        temperature={temperature}
        topP={topP}
        maxTokens={maxTokens}
      />
      <BottomBar {...nodeStats} />
    </div>
  );
}
