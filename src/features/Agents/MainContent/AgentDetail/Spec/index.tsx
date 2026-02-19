import { useState, useEffect, useRef } from "react";
import useResizablePanel from "@/hooks/useResizablePanel";

import { Tab } from "./Tab";
import { ModelParamsSidebar } from "./ModelParamsSidebar";
import { RuntimePanel, type ExecutionStatus } from "./RuntimePanel";

interface ExecutionState {
  status?: ExecutionStatus;
  elapsedSeconds?: number;
  tokens?: number;
  cost?: number;
}

interface LayoutProps {
  provider: string;
  model: string;
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
  onProviderChange: (value: string) => void;
  onModelChange: (value: string) => void;
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
  execution?: ExecutionState;
}

export function SpecLayout({
  provider,
  model,
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
  onProviderChange,
  onModelChange,
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
  execution,
}: LayoutProps) {
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [maxResponseHeight, setMaxResponseHeight] = useState(Infinity);

  useEffect(() => {
    const calculateMaxSizes = () => {
      if (mainContentRef.current) {
        const totalAvailableHeight = mainContentRef.current.offsetHeight;
        setMaxResponseHeight(totalAvailableHeight * 0.7);
      }
    };

    calculateMaxSizes();
    window.addEventListener("resize", calculateMaxSizes);

    return () => {
      window.removeEventListener("resize", calculateMaxSizes);
    };
  }, []);

  const COLLAPSED_HEIGHT = 44; // Status bar height (h-11)
  const EXPANDED_HEIGHT = 300;

  const {
    size: responsePanelHeight,
    setSize: setResponsePanelHeight,
    handleMouseDown: handleResponseMouseDown,
  } = useResizablePanel({
    initialSize: COLLAPSED_HEIGHT,
    minSize: COLLAPSED_HEIGHT,
    maxSize: maxResponseHeight,
    direction: "vertical",
    containerRef: mainContentRef as React.RefObject<HTMLElement>,
  });

  useEffect(() => {
    if (
      execution?.status &&
      execution.status !== "idle" &&
      responsePanelHeight <= COLLAPSED_HEIGHT
    ) {
      setResponsePanelHeight(Math.min(EXPANDED_HEIGHT, maxResponseHeight));
    }
  }, [execution?.status, responsePanelHeight, maxResponseHeight]);

  return (
    <div
      ref={mainContentRef}
      className="flex-1 flex flex-col overflow-hidden min-h-0 h-full"
    >
      <div className="flex-1 flex overflow-hidden min-h-0 -mb-[5px]">
        <div className="flex-1 min-h-0 min-w-0 overflow-auto custom-scrollbar bg-[#FCFDFF]">
          <Tab
            agentGoal={agentGoal}
            systemInstructions={systemInstructions}
            selectedTools={selectedTools}
            toolSearch={toolSearch}
            maxIterations={maxIterations}
            timeout={timeout}
            retryPolicy={retryPolicy}
            toolCallStrategy={toolCallStrategy}
            memoryEnabled={memoryEnabled}
            memorySource={memorySource}
            onAgentGoalChange={onAgentGoalChange}
            onSystemInstructionsChange={onSystemInstructionsChange}
            onToolToggle={onToolToggle}
            onToolSearchChange={onToolSearchChange}
            onMaxIterationsChange={onMaxIterationsChange}
            onTimeoutChange={onTimeoutChange}
            onRetryPolicyChange={onRetryPolicyChange}
            onToolCallStrategyChange={onToolCallStrategyChange}
            onMemoryEnabledChange={onMemoryEnabledChange}
            onMemorySourceChange={onMemorySourceChange}
          />
        </div>

        <div className="w-[300px] min-h-0 overflow-auto custom-scrollbar flex-shrink-0 border-l border-border-light bg-slate-50">
          <ModelParamsSidebar
            provider={provider}
            model={model}
            temperature={temperature}
            topP={topP}
            maxTokens={maxTokens}
            seed={seed}
            showAdvanced={showAdvanced}
            onProviderChange={onProviderChange}
            onModelChange={onModelChange}
            onTemperatureChange={onTemperatureChange}
            onTopPChange={onTopPChange}
            onMaxTokensChange={onMaxTokensChange}
            onSeedChange={onSeedChange}
            onShowAdvancedToggle={onShowAdvancedToggle}
          />
        </div>
      </div>

      <div
        className="h-3 resize-handle resize-handle-horizontal cursor-ns-resize -mb-[5px] flex-shrink-0"
        onMouseDown={handleResponseMouseDown}
      />

      <div
        className="min-h-0 overflow-auto custom-scrollbar flex-shrink-0 bg-slate-50"
        style={{ height: responsePanelHeight }}
      >
        <RuntimePanel {...execution} />
      </div>
    </div>
  );
}
