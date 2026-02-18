import { GoalPanel } from "./GoalPanel";
import { SystemInstructionsPanel } from "./SystemInstructionsPanel";
import { ToolsSelectorPanel } from "./ToolsSelectorPanel";
import { LoopControlsPanel } from "./LoopControlsPanel";
import { MemoryPanel } from "./MemoryPanel";

interface TabProps {
  agentGoal: string;
  systemInstructions: string;
  selectedTools: string[];
  toolSearch: string;
  maxIterations: number[];
  timeout: number[];
  retryPolicy: string;
  toolCallStrategy: string;
  memoryEnabled: boolean;
  memorySource: string;
  onAgentGoalChange: (value: string) => void;
  onSystemInstructionsChange: (value: string) => void;
  onToolToggle: (id: string) => void;
  onToolSearchChange: (value: string) => void;
  onMaxIterationsChange: (value: number[]) => void;
  onTimeoutChange: (value: number[]) => void;
  onRetryPolicyChange: (value: string) => void;
  onToolCallStrategyChange: (value: string) => void;
  onMemoryEnabledChange: (enabled: boolean) => void;
  onMemorySourceChange: (source: string) => void;
}

export function Tab({
  agentGoal,
  systemInstructions,
  selectedTools,
  toolSearch,
  maxIterations,
  timeout,
  retryPolicy,
  toolCallStrategy,
  memoryEnabled,
  memorySource,
  onAgentGoalChange,
  onSystemInstructionsChange,
  onToolToggle,
  onToolSearchChange,
  onMaxIterationsChange,
  onTimeoutChange,
  onRetryPolicyChange,
  onToolCallStrategyChange,
  onMemoryEnabledChange,
  onMemorySourceChange,
}: TabProps) {
  return (
    <div className="p-6 space-y-5">
      <GoalPanel value={agentGoal} onChange={onAgentGoalChange} />
      <SystemInstructionsPanel value={systemInstructions} onChange={onSystemInstructionsChange} />
      <ToolsSelectorPanel
        selectedTools={selectedTools}
        search={toolSearch}
        onToolToggle={onToolToggle}
        onSearchChange={onToolSearchChange}
      />
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
      <MemoryPanel
        enabled={memoryEnabled}
        source={memorySource}
        onEnabledChange={onMemoryEnabledChange}
        onSourceChange={onMemorySourceChange}
      />
    </div>
  );
}
