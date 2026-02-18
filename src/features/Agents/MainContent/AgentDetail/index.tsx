import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import { TabTitle } from "@/components/ui/Tabs/TabTitle";
import MainContent from "@/components/Layout/MainContent";

import { Header } from "./Header";
import { SpecLayout as Spec } from "./Spec";
import { Panel as Runs } from "./Runs";
import { mockRuns } from "./Runs/constants";
import type { AgentDetailAgent, AgentDetailProps } from "./types";

export type { AgentDetailAgent };

export function AgentDetail({ agent, onBack }: AgentDetailProps) {
  const isNew = agent.id === "new";
  const [agentName, setAgentName] = useState(agent.name);
  const [agentGoal, setAgentGoal] = useState(
    isNew ? "" : "Route and resolve customer inquiries across channels with context-aware responses. Escalate to human agents when confidence is below threshold."
  );
  const [systemInstructions, setSystemInstructions] = useState(
    isNew ? "" : "You are a customer support agent. Always greet the customer, identify the issue category, and attempt resolution before escalating."
  );
  const [selectedTools, setSelectedTools] = useState<string[]>(
    isNew ? [] : ["web-search", "api-call", "db-query", "email-send", "slack-msg"]
  );
  const [toolSearch, setToolSearch] = useState("");
  const [temperature, setTemperature] = useState([0.4]);
  const [topP, setTopP] = useState([0.95]);
  const [maxTokens, setMaxTokens] = useState([4096]);
  const [seed, setSeed] = useState("");
  const [maxIterations, setMaxIterations] = useState([10]);
  const [timeoutValue, setTimeoutValue] = useState([60]);
  const [retryPolicy, setRetryPolicy] = useState("exponential");
  const [toolCallStrategy, setToolCallStrategy] = useState("auto");
  const [memoryEnabled, setMemoryEnabled] = useState(agent.memoryEnabled);
  const [memorySource, setMemorySource] = useState("local");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("editor");

  const toggleTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    // TODO: implement
  };

  const handleRun = () => {
    // TODO: implement
  };

  return (
    <MainContent>
      <Header
        agentName={agentName}
        isNew={isNew}
        viewMode={viewMode}
        onBack={onBack}
        onAgentNameChange={setAgentName}
        onViewModeChange={setViewMode}
        onRun={handleRun}
        onSave={handleSave}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Tabs activeIndex={activeTab} onActiveIndexChange={setActiveTab}>
          <TabPanel title="Agent Spec">
            <Spec
              agentGoal={agentGoal}
              systemInstructions={systemInstructions}
              selectedTools={selectedTools}
              toolSearch={toolSearch}
              maxIterations={maxIterations}
              timeout={timeoutValue}
              retryPolicy={retryPolicy}
              toolCallStrategy={toolCallStrategy}
              memoryEnabled={memoryEnabled}
              memorySource={memorySource}
              temperature={temperature}
              topP={topP}
              maxTokens={maxTokens}
              seed={seed}
              showAdvanced={showAdvanced}
              onAgentGoalChange={setAgentGoal}
              onSystemInstructionsChange={setSystemInstructions}
              onToolToggle={toggleTool}
              onToolSearchChange={setToolSearch}
              onMaxIterationsChange={setMaxIterations}
              onTimeoutChange={setTimeoutValue}
              onRetryPolicyChange={setRetryPolicy}
              onToolCallStrategyChange={setToolCallStrategy}
              onMemoryEnabledChange={setMemoryEnabled}
              onMemorySourceChange={setMemorySource}
              onTemperatureChange={setTemperature}
              onTopPChange={setTopP}
              onMaxTokensChange={setMaxTokens}
              onSeedChange={setSeed}
              onShowAdvancedToggle={() => setShowAdvanced((v) => !v)}
            />
          </TabPanel>
          <TabPanel title={<TabTitle label="Runs" count={mockRuns.length} />}>
            <Runs runs={mockRuns} />
          </TabPanel>
        </Tabs>
      </div>
    </MainContent>
  );
}
