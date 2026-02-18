import { AgentGoalPanel } from "./AgentGoalPanel";
import { SystemInstructionsPanel } from "./SystemInstructionsPanel";
import { ToolsSelectorPanel } from "./ToolsSelectorPanel";
import { LoopControlsPanel } from "./LoopControlsPanel";
import { MemoryPanel } from "./MemoryPanel";
import { ModelParamsSidebar } from "./ModelParamsSidebar";

interface AgentSpecTabProps {
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
  temperature: number[];
  topP: number[];
  maxTokens: number[];
  seed: string;
  showAdvanced: boolean;
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
  onTemperatureChange: (value: number[]) => void;
  onTopPChange: (value: number[]) => void;
  onMaxTokensChange: (value: number[]) => void;
  onSeedChange: (value: string) => void;
  onShowAdvancedToggle: () => void;
}

export function AgentSpecTab({
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
  temperature,
  topP,
  maxTokens,
  seed,
  showAdvanced,
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
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
  onSeedChange,
  onShowAdvancedToggle,
}: AgentSpecTabProps) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden -m-6">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
        <AgentGoalPanel value={agentGoal} onChange={onAgentGoalChange} />
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
      <ModelParamsSidebar
        temperature={temperature}
        topP={topP}
        maxTokens={maxTokens}
        seed={seed}
        showAdvanced={showAdvanced}
        onTemperatureChange={onTemperatureChange}
        onTopPChange={onTopPChange}
        onMaxTokensChange={onMaxTokensChange}
        onSeedChange={onSeedChange}
        onShowAdvancedToggle={onShowAdvancedToggle}
      />
    </div>
  );
}
