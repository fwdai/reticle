import { useState, useEffect, useRef, useCallback } from "react";
import MainContent from "@/components/Layout/MainContent";

import { AgentProvider } from "@/contexts/AgentContext";
import { Header } from "./Header";
import { SpecLayout as Spec } from "./Spec";
import type { AgentDetailAgent, AgentDetailProps } from "./types";
import { getAgentById, insertAgent, updateAgent } from "@/lib/storage";
import { runAgentAction } from "@/actions/agentActions";
import type { ExecutionState } from "@/contexts/AgentContext";

export type { AgentDetailAgent };

const DEBOUNCE_MS = 800;

function parseParamsJson(json: string): { temperature?: number; top_p?: number; max_tokens?: number; seed?: string } {
  try {
    const v = JSON.parse(json ?? "{}");
    return typeof v === "object" && v ? v : {};
  } catch {
    return {};
  }
}

export function AgentDetail({ agent, onBack, onSaved }: AgentDetailProps) {
  const isNew = agent.id === "new";
  const [effectiveId, setEffectiveId] = useState<string | null>(isNew ? null : agent.id);
  const [agentName, setAgentName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description ?? "");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState(agent.model || "gpt-4.1");
  const [agentGoal, setAgentGoal] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");
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
  const [viewMode, setViewMode] = useState("editor");
  const [isLoading, setIsLoading] = useState(!isNew);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(isNew ? "unsaved" : "saved");
  const skipNextAutoSaveRef = useRef(!isNew);
  const [execution, setExecution] = useState<ExecutionState>({ status: "idle", steps: [] });

  const loadAgent = useCallback(async () => {
    if (!effectiveId) return;
    setIsLoading(true);
    try {
      const record = await getAgentById(effectiveId);
      if (record) {
        setAgentName(record.name);
        setDescription(record.description ?? "");
        setProvider(record.provider);
        setModel(record.model);
        setAgentGoal(record.agent_goal ?? "");
        setSystemInstructions(record.system_instructions ?? "");
        const params = parseParamsJson(record.params_json);
        setTemperature([params.temperature ?? 0.4]);
        setTopP([params.top_p ?? 0.95]);
        setMaxTokens([params.max_tokens ?? 4096]);
        setSeed(params.seed ?? "");
        setMaxIterations([record.max_iterations ?? 10]);
        setTimeoutValue([record.timeout_seconds ?? 60]);
        setRetryPolicy(record.retry_policy ?? "exponential");
        setToolCallStrategy(record.tool_call_strategy ?? "auto");
        setMemoryEnabled(record.memory_enabled === 1);
        setMemorySource(record.memory_source ?? "local");
      }
      setSaveStatus("saved");
    } finally {
      setIsLoading(false);
    }
  }, [effectiveId]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  const buildPayload = useCallback(() => ({
    name: agentName.trim() || "Untitled Agent",
    description: description.trim() || null,
    provider,
    model,
    params_json: JSON.stringify({
      temperature: temperature[0],
      top_p: topP[0],
      max_tokens: maxTokens[0],
      ...(seed.trim() ? { seed: seed.trim() } : {}),
    }),
    agent_goal: agentGoal.trim() || null,
    system_instructions: systemInstructions.trim() || null,
    tools_json: "[]",
    max_iterations: maxIterations[0],
    timeout_seconds: timeoutValue[0],
    retry_policy: retryPolicy,
    tool_call_strategy: toolCallStrategy,
    memory_enabled: memoryEnabled ? 1 : 0,
    memory_source: memorySource,
  }), [
    agentName, description, provider, model, temperature, topP, maxTokens, seed,
    agentGoal, systemInstructions, maxIterations, timeoutValue, retryPolicy,
    toolCallStrategy, memoryEnabled, memorySource,
  ]);

  const performSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const payload = buildPayload();
      if (!effectiveId) {
        const id = await insertAgent(payload);
        setEffectiveId(id);
        onSaved?.();
      } else {
        await updateAgent(effectiveId, payload);
        onSaved?.();
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [effectiveId, buildPayload, onSaved]);

  useEffect(() => {
    if (isLoading) return;
    if (!effectiveId && !agentName.trim()) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    setSaveStatus("unsaved");
    const timer = setTimeout(performSave, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isLoading, buildPayload, effectiveId, agentName, performSave]);

  const runStartRef = useRef<number | null>(null);

  const handleRun = useCallback(async (taskInput?: string) => {
    if (!taskInput?.trim() || !effectiveId) return;
    runStartRef.current = Date.now();
    const record = await getAgentById(effectiveId);
    if (!record) return;
    await runAgentAction(record, taskInput.trim(), setExecution);
  }, [effectiveId]);

  useEffect(() => {
    if (execution.status !== "running") return;
    const interval = setInterval(() => {
      if (runStartRef.current) {
        const elapsed = (Date.now() - runStartRef.current) / 1000;
        setExecution(prev =>
          prev.status === "running" ? { ...prev, elapsedSeconds: elapsed } : prev
        );
      }
    }, 100);
    return () => clearInterval(interval);
  }, [execution.status]);

  const agentContextValue = {
    runAgent: handleRun,
    execution,
    isRunning: execution.status === "running",
  };

  return (
    <MainContent>
      <AgentProvider value={agentContextValue}>
        <Header
          agentName={agentName}
          isNew={isNew}
          viewMode={viewMode}
          saveStatus={saveStatus}
          onBack={onBack}
          onAgentNameChange={setAgentName}
          onViewModeChange={setViewMode}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <Spec
            agentId={effectiveId}
            provider={provider}
            model={model}
            agentGoal={agentGoal}
            systemInstructions={systemInstructions}
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
            onProviderChange={setProvider}
            onModelChange={setModel}
            onAgentGoalChange={setAgentGoal}
            onSystemInstructionsChange={setSystemInstructions}
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
            onShowAdvancedToggle={() => setShowAdvanced(v => !v)}
          />
        </div>
      </AgentProvider>
    </MainContent>
  );
}
