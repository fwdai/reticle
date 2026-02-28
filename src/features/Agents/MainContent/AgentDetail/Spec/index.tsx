import { useState, useEffect, useRef } from "react";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import useResizablePanel from "@/hooks/useResizablePanel";
import { useAgentContext } from "@/contexts/AgentContext";
import { ToolsContainer } from "@/components/Tools/ToolsContainer";

import { Tab } from "./Tab";
import { ModelParamsSidebar } from "./ModelParamsSidebar";
import { RuntimePanel } from "./RuntimePanel";

const panelContentClass = "h-full min-h-0 p-6 overflow-y-auto custom-scrollbar bg-[#FCFDFF]";

interface LayoutProps {
  agentId: string | null;
  provider: string;
  model: string;
  agentGoal: string;
  systemInstructions: string;
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

export function SpecLayout({
  agentId,
  provider,
  model,
  agentGoal,
  systemInstructions,
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
}: LayoutProps) {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const { execution } = useAgentContext();

  const [maxResponseHeight, setMaxResponseHeight] = useState(Infinity);

  useEffect(() => {
    const calculateMaxSizes = () => {
      if (mainContentRef.current) {
        setMaxResponseHeight(mainContentRef.current.offsetHeight * 0.7);
      }
    };
    calculateMaxSizes();
    window.addEventListener("resize", calculateMaxSizes);
    return () => window.removeEventListener("resize", calculateMaxSizes);
  }, []);

  const COLLAPSED_HEIGHT = 114;
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
    if (execution.status && execution.status !== "idle" && responsePanelHeight <= COLLAPSED_HEIGHT) {
      setResponsePanelHeight(Math.min(EXPANDED_HEIGHT, maxResponseHeight));
    }
  }, [execution.status, responsePanelHeight, maxResponseHeight, setResponsePanelHeight]);

  return (
    <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
      <div className="flex-1 flex overflow-hidden min-h-0 -mb-[5px]">
        <Tabs>
          <TabPanel title="Agent Spec">
            <div className={panelContentClass}>
              <Tab
                agentGoal={agentGoal}
                systemInstructions={systemInstructions}
                maxIterations={maxIterations}
                timeout={timeout}
                retryPolicy={retryPolicy}
                toolCallStrategy={toolCallStrategy}
                memoryEnabled={memoryEnabled}
                memorySource={memorySource}
                onAgentGoalChange={onAgentGoalChange}
                onSystemInstructionsChange={onSystemInstructionsChange}
                onMaxIterationsChange={onMaxIterationsChange}
                onTimeoutChange={onTimeoutChange}
                onRetryPolicyChange={onRetryPolicyChange}
                onToolCallStrategyChange={onToolCallStrategyChange}
                onMemoryEnabledChange={onMemoryEnabledChange}
                onMemorySourceChange={onMemorySourceChange}
              />
            </div>
          </TabPanel>
          <TabPanel title="Tools">
            <div className={panelContentClass}>
              <ToolsContainer entityId={agentId} entityType="agent" />
            </div>
          </TabPanel>
        </Tabs>
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
        <RuntimePanel />
      </div>
    </div>
  );
}
