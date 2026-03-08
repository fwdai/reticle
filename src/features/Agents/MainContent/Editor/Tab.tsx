import { GoalPanel } from "./GoalPanel";
import { SystemInstructionsPanel } from "./SystemInstructionsPanel";
import { LoopControlsPanel } from "./LoopControlsPanel";

interface TabProps {
  agentGoal: string;
  systemInstructions: string;
  maxIterations: number[];
  timeout: number[];
  retryPolicy: string;
  toolCallStrategy: string;
  onAgentGoalChange: (value: string) => void;
  onSystemInstructionsChange: (value: string) => void;
  onMaxIterationsChange: (value: number[]) => void;
  onTimeoutChange: (value: number[]) => void;
  onRetryPolicyChange: (value: string) => void;
  onToolCallStrategyChange: (value: string) => void;
}

export function Tab({
  agentGoal,
  systemInstructions,
  maxIterations,
  timeout,
  retryPolicy,
  toolCallStrategy,
  onAgentGoalChange,
  onSystemInstructionsChange,
  onMaxIterationsChange,
  onTimeoutChange,
  onRetryPolicyChange,
  onToolCallStrategyChange,
}: TabProps) {
  return (
    <div className="space-y-5">
      <GoalPanel value={agentGoal} onChange={onAgentGoalChange} />
      <SystemInstructionsPanel value={systemInstructions} onChange={onSystemInstructionsChange} />
      <LoopControlsPanel
        maxIterations={maxIterations}
        timeout={timeout}
        retryPolicy={retryPolicy}
        toolCallStrategy={toolCallStrategy}
        onMaxIterationsChange={onMaxIterationsChange}
        onTimeoutChange={onTimeoutChange}
        onRetryPolicyChange={onRetryPolicyChange}
        onToolCallStrategyChange={onToolCallStrategyChange}
      />
    </div>
  );
}
