import { AgentFlowCanvas } from "./AgentFlowCanvas";
import { AgentMetricsBar } from "./AgentMetricsBar";
import { BottomBar } from "@/components/Visualizer";

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
  const nodeStats = {
    total: 8,
    active: 0,
    idle: 8,
    error: 0,
  };

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
