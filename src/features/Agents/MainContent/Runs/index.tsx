import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listExecutions } from "@/lib/storage";
import { calculateRequestCost } from "@/lib/modelPricing";
import { formatDuration, formatRelativeTime } from "@/lib/helpers/time";
import { formatCost, formatTokens } from "@/lib/helpers/format";
import { RunDetail } from "@/features/Runs/MainContent/RunDetail";
import type { RunDetailRun } from "@/features/Runs/MainContent/RunDetail";
import type { Execution } from "@/types";

interface RunRow {
  id: string;
  status: "success" | "error" | "running";
  loops: number;
  tokens: number;
  cost: number;
  latencyMs: number | null;
  timestamp: string;
  model: string;
  provider: string;
}

function executionToRow(exec: Execution): RunRow {
  let model = "—";
  let provider = "";
  try {
    const snapshot = exec.snapshot_json ? JSON.parse(exec.snapshot_json) : {};
    model = snapshot.model ?? snapshot.configuration?.model ?? "—";
    provider = snapshot.provider ?? snapshot.configuration?.provider ?? "";
  } catch { /* ignore */ }

  let loops = 0;
  try {
    if (exec.steps_json) {
      const steps = JSON.parse(exec.steps_json);
      loops = Array.isArray(steps) ? steps.length : 0;
    }
  } catch { /* ignore */ }

  let tokens = 0;
  let costUsd = 0;
  let latencyMs: number | null = null;
  try {
    const usage = exec.usage_json ? JSON.parse(exec.usage_json) : {};
    latencyMs = usage.latency_ms ?? (
      exec.ended_at != null && exec.started_at != null ? exec.ended_at - exec.started_at : null
    );
    const input = usage.input_tokens ?? usage.inputTokens ?? 0;
    const output = usage.output_tokens ?? usage.outputTokens ?? 0;
    tokens = (input + output) || (usage.total_tokens ?? usage.totalTokens ?? 0);
    costUsd = usage.cost_usd ?? usage.costUsd ?? 0;
    if (costUsd === 0 && provider && model !== "—" && (input > 0 || output > 0)) {
      costUsd = calculateRequestCost(provider, model, { inputTokens: input, outputTokens: output }) ?? 0;
    }
  } catch {
    if (exec.ended_at != null && exec.started_at != null) {
      latencyMs = exec.ended_at - exec.started_at;
    }
  }

  const status: RunRow["status"] =
    exec.status === "running" ? "running" :
    exec.status === "succeeded" ? "success" : "error";

  return {
    id: exec.id!,
    status,
    loops,
    tokens,
    cost: costUsd,
    latencyMs,
    timestamp: exec.started_at ? formatRelativeTime(exec.started_at) : "—",
    model,
    provider,
  };
}

function rowToDetailRun(row: RunRow): RunDetailRun {
  return {
    id: row.id,
    scenarioName: "Agent Run",
    status: row.status === "running" ? "success" : row.status,
    model: row.model,
    latency: row.latencyMs != null ? formatDuration(row.latencyMs) : "—",
    tokens: row.tokens,
    cost: formatCost(row.cost),
    timestamp: row.timestamp,
  };
}

interface RunsPanelProps {
  agentId: string | null;
}

export function RunsPanel({ agentId }: RunsPanelProps) {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<RunDetailRun | null>(null);

  useEffect(() => {
    if (!agentId) { setIsLoading(false); return; }
    setIsLoading(true);
    listExecutions({ type: "agent", runnableId: agentId })
      .then((execs) => setRows(execs.map(executionToRow)))
      .finally(() => setIsLoading(false));
  }, [agentId]);

  if (selectedRun) {
    return <RunDetail run={selectedRun} onBack={() => setSelectedRun(null)} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading runs…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <FlaskConical className="mb-3 h-6 w-6 text-text-muted/40" />
        <p className="mb-1 text-sm font-medium text-text-main">No runs yet</p>
        <p className="text-xs text-text-muted">Run this agent to see execution history here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              "group rounded-xl border border-border-light bg-white p-4 hover:border-slate-300 transition-colors",
              row.status === "running" && "border-primary/30"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                row.status === "success" && "bg-green-100 text-green-600",
                row.status === "error" && "bg-red-100 text-red-600",
                row.status === "running" && "bg-primary/10 text-primary",
              )}>
                {row.status === "success" && <CheckCircle2 className="h-4 w-4" />}
                {row.status === "error" && <XCircle className="h-4 w-4" />}
                {row.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text-main font-mono truncate">{row.id}</span>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide flex-shrink-0",
                    row.status === "success" && "text-green-600",
                    row.status === "error" && "text-red-600",
                    row.status === "running" && "text-primary",
                  )}>
                    {row.status}
                  </span>
                </div>
                <span className="text-[11px] text-text-muted">{row.timestamp}</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Loops</span>
                  <span className="text-xs font-mono text-text-main">{row.loops || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tokens</span>
                  <span className="text-xs font-mono text-text-main">{formatTokens(row.tokens, false)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Cost</span>
                  <span className="text-xs font-mono text-primary">{formatCost(row.cost)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Latency</span>
                  <span className="text-xs font-mono text-text-main">
                    {row.latencyMs != null ? formatDuration(row.latencyMs) : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium"
                  onClick={() => setSelectedRun(rowToDetailRun(row))}
                >
                  <ExternalLink className="h-3 w-3" />
                  Trace
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
