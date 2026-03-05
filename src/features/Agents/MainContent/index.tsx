import { useState, useEffect, useCallback } from "react";
import { AgentDetail, type AgentDetailAgent } from "./AgentDetail";
import { AgentList, type Agent, type AgentLastRun } from "./List";
import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { listAgents, agentRecordToListAgent, listExecutions } from "@/lib/storage";
import { calculateRequestCost } from "@/lib/modelPricing";
import { formatDuration } from "@/lib/helpers/time";
import { formatTokens, formatCost } from "@/lib/helpers/format";
import type { AgentFilterId } from "../index";
import type { Execution } from "@/types";

function buildLastRun(exec: Execution): AgentLastRun {
  let duration = "—";
  let tokens = "—";
  let cost = "—";

  try {
    const usage = exec.usage_json ? JSON.parse(exec.usage_json) : {};
    const latencyMs =
      usage.latency_ms ??
      (exec.ended_at != null && exec.started_at != null
        ? exec.ended_at - exec.started_at
        : null);
    duration = latencyMs != null ? formatDuration(latencyMs) : "—";

    const prompt = usage.input_tokents ?? usage.inputTokens ?? 0;
    const completion = usage.output_tokens ?? usage.outputTokens ?? 0;
    const totalTokens =
      (prompt + completion) || (usage.total_tokens ?? usage.totalTokens ?? 0);
    tokens = formatTokens(totalTokens, false);

    let costUsd = usage.cost_usd ?? usage.costUsd ?? 0;
    if (costUsd === 0) {
      const snapshot = exec.snapshot_json ? JSON.parse(exec.snapshot_json) : {};
      const provider = snapshot.configuration?.provider ?? "";
      const model = snapshot.configuration?.model ?? "";
      if (provider && model && (prompt > 0 || completion > 0)) {
        const calculated = calculateRequestCost(provider, model, {
          inputTokens: prompt,
          outputTokens: completion,
          cachedTokens: usage.cached_tokens ?? usage.cachedTokens,
        });
        if (calculated != null) costUsd = calculated;
      }
    }
    cost = formatCost(costUsd);
  } catch {
    if (exec.ended_at != null && exec.started_at != null) {
      duration = formatDuration(exec.ended_at - exec.started_at);
    }
  }

  return {
    timestamp: exec.started_at ?? 0,
    duration,
    tokens,
    cost,
  };
}

interface AgentsMainContentProps {
  filter: AgentFilterId;
}

function AgentsMainContent({ filter }: AgentsMainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [starredAgents, setStarredAgents] = useState<Set<string>>(new Set());
  const [lastRunByAgentId, setLastRunByAgentId] = useState<Map<string, AgentLastRun>>(new Map());

  const refreshAgents = useCallback(async () => {
    const [records, executions] = await Promise.all([
      listAgents(),
      listExecutions({ type: "agent", limit: 1000 }),
    ]);
    setAgents(records.map(agentRecordToListAgent));

    const latestExecMap = new Map<string, Execution>();
    for (const exec of executions) {
      if (exec.runnable_id && exec.started_at) {
        const existing = latestExecMap.get(exec.runnable_id);
        if (!existing || (existing.started_at ?? 0) < exec.started_at) {
          latestExecMap.set(exec.runnable_id, exec);
        }
      }
    }

    const lastRunMap = new Map<string, AgentLastRun>();
    for (const [agentId, exec] of latestExecMap) {
      lastRunMap.set(agentId, buildLastRun(exec));
    }
    setLastRunByAgentId(lastRunMap);
  }, []);

  useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);

  const filteredAgents = (() => {
    let result = agents.filter((a) => {
      if (filter === "ready" && a.status !== "ready") return false;
      if (filter === "needs-config" && a.status !== "needs-config") return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q)
      );
    });

    if (filter === "recently-run") {
      result = [...result].sort((a, b) =>
        (lastRunByAgentId.get(b.id)?.timestamp ?? 0) - (lastRunByAgentId.get(a.id)?.timestamp ?? 0)
      );
    }

    return result;
  })();

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredAgents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    setSelectedAgent(null);
  }, [filter]);

  const handleCreateAgent = () => {
    const newAgent: Agent = {
      id: "new",
      name: "",
      description: "",
      status: "needs-config",
      model: "gpt-4.1",
      toolsCount: 0,
      memoryEnabled: false,
      starred: false,
    };
    setSelectedAgent(newAgent);
  };

  const handleSelectAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);
  };

  const handleBackFromDetail = () => {
    setSelectedAgent(null);
    refreshAgents();
  };

  if (selectedAgent) {
    const detailAgent: AgentDetailAgent = {
      id: selectedAgent.id,
      name: selectedAgent.name,
      description: selectedAgent.description,
      model: selectedAgent.model,
      toolsCount: selectedAgent.toolsCount,
      memoryEnabled: selectedAgent.memoryEnabled,
    };
    return (
      <AgentDetail
        agent={detailAgent}
        onBack={handleBackFromDetail}
        onSaved={refreshAgents}
      />
    );
  }

  return (
    <MainContent>
      <Header
        search={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateAgent={handleCreateAgent}
        agentCount={filteredAgents.length}
      />

      <AgentList
        agents={filteredAgents}
        starredAgentIds={starredAgents}
        lastRunByAgentId={lastRunByAgentId}
        onSelectAgent={handleSelectAgent}
        onToggleStar={toggleStar}
      />
    </MainContent>
  );
}

export default AgentsMainContent;
