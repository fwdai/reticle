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
  execution?: ExecutionState;
}

export function SpecLayout({
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
  execution,
}: LayoutProps) {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);

  const [maxResponseHeight, setMaxResponseHeight] = useState(Infinity);
  const [maxConfigWidth, setMaxConfigWidth] = useState(Infinity);

  useEffect(() => {
    const calculateMaxSizes = () => {
      if (mainContentRef.current) {
        const totalAvailableHeight = mainContentRef.current.offsetHeight;
        setMaxResponseHeight(totalAvailableHeight * 0.7);
      }
      if (topPanelRef.current) {
        const totalAvailableWidth = topPanelRef.current.offsetWidth;
        setMaxConfigWidth(totalAvailableWidth * 0.35);
      }
    };

    calculateMaxSizes();
    window.addEventListener("resize", calculateMaxSizes);

    return () => {
      window.removeEventListener("resize", calculateMaxSizes);
    };
  }, []);

  const { size: responsePanelHeight, handleMouseDown: handleResponseMouseDown } =
    useResizablePanel({
      initialSize: 300,
      minSize: 200,
      maxSize: maxResponseHeight,
      direction: "vertical",
      containerRef: mainContentRef as React.RefObject<HTMLElement>,
    });

  const { size: configPanelWidth, handleMouseDown: handleConfigMouseDown } =
    useResizablePanel({
      initialSize: 300,
      minSize: 200,
      maxSize: maxConfigWidth,
      direction: "horizontal",
      containerRef: topPanelRef as React.RefObject<HTMLElement>,
    });

  return (
    <div
      ref={mainContentRef}
      className="flex-1 flex flex-col overflow-hidden min-h-0 h-full"
    >
      <div ref={topPanelRef} className="flex-1 flex overflow-hidden min-h-0 -mb-[5px]">
        <div className="flex-1 min-h-0 min-w-0 overflow-auto custom-scrollbar -mr-[5px] bg-[#FCFDFF]">
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

        <div
          className="w-3 h-full resize-handle resize-handle-vertical cursor-ew-resize -mr-[5px] flex-shrink-0"
          onMouseDown={handleConfigMouseDown}
        />

        <div
          style={{ width: configPanelWidth }}
          className="min-h-0 overflow-auto custom-scrollbar flex-shrink-0 bg-slate-50"
        >
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
