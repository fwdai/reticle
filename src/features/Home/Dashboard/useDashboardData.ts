import { useState, useEffect, useMemo } from "react";
import {
  listScenarios,
  listAgents,
  listExecutions,
} from "@/lib/storage";
import type { Execution, Scenario } from "@/types";
import { calculateRequestCost } from "@/lib/modelPricing";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface ModelUsageItem {
  model: string;
  runs: number;
  tokens: number;
  percent: number;
}

export interface TokenCostData {
  tokensUsed: number;
  totalCost: number;
  avgLatency: number;
  tokensDelta?: number;
  costDelta?: number;
  latencyDelta?: number;
}

export interface RecentRun {
  id: string;
  name: string;
  type: "scenario" | "agent";
  model: string;
  status: "success" | "error";
  tokens: number;
  cost: number;
  latency: number;
  time: string;
}

export interface DashboardStats {
  scenariosCount: number;
  agentsCount: number;
  runsLastWeek: number;
  successRate: number;
}

export interface DashboardData {
  isLoading: boolean;
  stats: DashboardStats;
  modelUsage: ModelUsageItem[];
  tokenCost: TokenCostData;
  recentRuns: RecentRun[];
}

function getModelFromSnapshot(snapshotJson: string | null | undefined): string {
  try {
    const snap = snapshotJson ? JSON.parse(snapshotJson) : {};
    return snap.configuration?.model ?? "—";
  } catch {
    return "—";
  }
}

function getProviderFromSnapshot(
  snapshotJson: string | null | undefined
): string {
  try {
    const snap = snapshotJson ? JSON.parse(snapshotJson) : {};
    return snap.configuration?.provider ?? "";
  } catch {
    return "";
  }
}

function parseUsage(usageJson: string | null | undefined): {
  tokens: number;
  costUsd: number;
} {
  try {
    const u = usageJson ? JSON.parse(usageJson) : {};
    const prompt = u.input_tokents ?? u.inputTokens ?? 0;
    const completion = u.output_tokens ?? u.outputTokens ?? 0;
    const tokens = prompt + completion || (u.total_tokens ?? u.totalTokens ?? 0);
    const costUsd = u.cost_usd ?? u.costUsd ?? 0;
    return { tokens, costUsd };
  } catch {
    return { tokens: 0, costUsd: 0 };
  }
}

function formatRelativeTime(ms: number): string {
  const now = Date.now();
  const diff = now - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

export function useDashboardData(): DashboardData {
  const [isLoading, setIsLoading] = useState(true);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [agents, setAgents] = useState<{ id: string }[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [s, a, e] = await Promise.all([
          listScenarios(),
          listAgents(),
          listExecutions({ limit: 500 }),
        ]);
        if (cancelled) return;
        setScenarios(s);
        setAgents(a);
        setExecutions(e);
      } catch (err) {
        if (!cancelled) {
          setScenarios([]);
          setAgents([]);
          setExecutions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const now = Date.now();
    const weekAgo = now - ONE_WEEK_MS;
    const execsLastWeek = executions.filter(
      (e) => e.started_at != null && e.started_at >= weekAgo
    );

    const scenarioById = new Map(
      scenarios
        .filter((s): s is Scenario & { id: string } => !!s.id)
        .map((s) => [s.id!, s])
    );

    const modelAgg = new Map<string, { runs: number; tokens: number }>();
    let totalTokensWeek = 0;
    let totalCostWeek = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const exec of execsLastWeek) {
      const model = getModelFromSnapshot(exec.snapshot_json);
      const provider = getProviderFromSnapshot(exec.snapshot_json);
      const { tokens, costUsd } = parseUsage(exec.usage_json);

      let execCost = costUsd;
      if (execCost === 0 && provider && model && model !== "—" && tokens > 0) {
        try {
          const u = exec.usage_json ? JSON.parse(exec.usage_json) : {};
          const calculated = calculateRequestCost(provider, model, {
            inputTokens: u.input_tokents ?? u.inputTokens ?? 0,
            outputTokens: u.output_tokens ?? u.outputTokens ?? 0,
          });
          if (calculated != null) execCost = calculated;
        } catch {
          /* ignore */
        }
      }
      totalTokensWeek += tokens;
      totalCostWeek += execCost;

      if (
        exec.started_at != null &&
        exec.ended_at != null &&
        exec.status === "succeeded"
      ) {
        latencySum += exec.ended_at - exec.started_at;
        latencyCount++;
      }

      const key = model === "—" ? "Unknown" : model;
      const cur = modelAgg.get(key) ?? { runs: 0, tokens: 0 };
      modelAgg.set(key, {
        runs: cur.runs + 1,
        tokens: cur.tokens + tokens,
      });
    }

    const modelUsage: ModelUsageItem[] = (() => {
      const total = execsLastWeek.length;
      const arr = Array.from(modelAgg.entries()).map(([model, data]) => ({
        model,
        runs: data.runs,
        tokens: data.tokens,
        percent: total > 0 ? (data.runs / total) * 100 : 0,
      }));
      return arr.sort((a, b) => b.percent - a.percent);
    })();

    const recentRuns: RecentRun[] = executions.slice(0, 10).map((exec) => {
      const model = getModelFromSnapshot(exec.snapshot_json);
      const provider = getProviderFromSnapshot(exec.snapshot_json);
      const snapshot = exec.snapshot_json
        ? (() => {
            try {
              return JSON.parse(exec.snapshot_json);
            } catch {
              return {};
            }
          })()
        : {};
      const name =
        exec.type === "scenario"
          ? scenarioById.get(exec.runnable_id)?.title ?? snapshot.name ?? "Unknown"
          : snapshot.name ?? exec.type;
      const { tokens, costUsd } = parseUsage(exec.usage_json);
      let cost = costUsd;
      if (cost === 0 && provider && model && tokens > 0) {
        const u = exec.usage_json ? JSON.parse(exec.usage_json) : {};
        const calc = calculateRequestCost(provider, model, {
          inputTokens: u.input_tokents ?? u.inputTokens ?? 0,
          outputTokens: u.output_tokens ?? u.outputTokens ?? 0,
        });
        if (calc != null) cost = calc;
      }
      const latencyMs =
        exec.ended_at != null && exec.started_at != null
          ? exec.ended_at - exec.started_at
          : 0;
      const latencySec = latencyMs / 1000;

      return {
        id: exec.id ?? exec.runnable_id ?? "",
        name,
        type: exec.type === "agent" ? "agent" : "scenario",
        model,
        status: (exec.status === "succeeded" ? "success" : "error") as
          | "success"
          | "error",
        tokens,
        cost,
        latency: latencySec,
        time: exec.started_at ? formatRelativeTime(exec.started_at) : "—",
      };
    });

    return {
      isLoading,
      stats: {
        scenariosCount: scenarios.length,
        agentsCount: agents.length,
        runsLastWeek: execsLastWeek.length,
        successRate:
          execsLastWeek.length > 0
            ? (execsLastWeek.filter((e) => e.status === "succeeded").length /
                execsLastWeek.length) *
              100
            : 0,
      },
      modelUsage,
      tokenCost: {
        tokensUsed: totalTokensWeek,
        totalCost: totalCostWeek,
        avgLatency: latencyCount > 0 ? latencySum / 1000 / latencyCount : 0,
        tokensDelta: undefined,
        costDelta: undefined,
        latencyDelta: undefined,
      },
      recentRuns,
    };
  }, [executions, scenarios, agents, isLoading]);
}
