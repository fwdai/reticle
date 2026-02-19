import type { Execution } from "@/types";
import { getLastExecutionForScenario, countAttachmentsByScenarioId, countToolsByScenarioId } from "@/lib/storage";
import { formatDuration, formatRelativeTime } from "@/lib/helpers/time";
import { calculateRequestCost } from "@/lib/modelPricing";

export interface ScenarioLastRun {
  timestamp: string;
  duration: string;
  tokens: number;
  cost: string;
  status: "succeeded" | "failed";
}

export interface ScenarioStats {
  toolsCount: number;
  attachmentsCount: number;
  lastRun: ScenarioLastRun | null;
}

function parseLastExecution(exec: Execution): ScenarioLastRun | null {
  try {
    let latency = "—";
    let tokens = 0;
    let costUsd = 0;
    let provider = "";
    let model = "—";

    const snapshot = exec.snapshot_json ? JSON.parse(exec.snapshot_json) : {};
    provider = snapshot.configuration?.provider ?? "";
    model = snapshot.configuration?.model ?? "—";

    const usage = exec.usage_json ? JSON.parse(exec.usage_json) : {};
    const latencyMs = usage.latency_ms ?? (exec.ended_at != null && exec.started_at != null ? exec.ended_at - exec.started_at : null);
    latency = latencyMs != null ? formatDuration(latencyMs) : "—";
    const prompt = usage.input_tokents ?? usage.inputTokens ?? 0;
    const completion = usage.output_tokens ?? usage.outputTokens ?? 0;
    tokens = (prompt + completion) || (usage.total_tokens ?? usage.totalTokens ?? 0);
    costUsd = usage.cost_usd ?? usage.costUsd ?? 0;

    if (costUsd === 0 && provider && model && model !== "—" && (prompt > 0 || completion > 0)) {
      const calculated = calculateRequestCost(provider, model, {
        inputTokens: prompt,
        outputTokens: completion,
        cachedTokens: usage.cached_tokens ?? usage.cachedTokens,
      });
      if (calculated != null) costUsd = calculated;
    }

    const timestamp = exec.started_at ? formatRelativeTime(exec.started_at) : "—";

    return {
      timestamp,
      duration: latency,
      tokens,
      cost: costUsd > 0 ? `$${costUsd.toFixed(4)}` : "$0.0000",
      status: exec.status === "succeeded" ? "succeeded" : "failed",
    };
  } catch {
    return null;
  }
}

export async function fetchScenarioStats(scenarioId: string): Promise<ScenarioStats> {
  const [lastExec, attachmentsCount, toolsCount] = await Promise.all([
    getLastExecutionForScenario(scenarioId),
    countAttachmentsByScenarioId(scenarioId),
    countToolsByScenarioId(scenarioId),
  ]);

  return {
    toolsCount,
    attachmentsCount,
    lastRun: lastExec ? parseLastExecution(lastExec) : null,
  };
}

export function truncatePrompt(prompt: string | null | undefined, maxLen: number = 80): string {
  if (!prompt || !prompt.trim()) return "";
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim() + "…";
}
