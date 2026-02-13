import { useState, useEffect, useCallback } from "react";
import { Filter, CheckCircle, XCircle } from "lucide-react";

import type { Execution, Scenario } from "@/types";
import MainContent from "@/components/Layout/MainContent";
import { Pagination } from "@/components/ui/Pagination";
import { listExecutions, listScenarios, countExecutions } from "@/lib/storage";
import Header from "../Header";

interface Run {
  id: string;
  scenarioName: string;
  status: "success" | "error";
  model: string;
  latency: string;
  tokens: number;
  cost: string;
  timestamp: string;
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "Just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString();
}

function executionToRun(exec: Execution, scenarioById: Map<string, Scenario>): Run {
  let model = "—";
  try {
    const snapshot = exec.snapshot_json ? JSON.parse(exec.snapshot_json) : {};
    model = snapshot.configuration?.model ?? "—";
  } catch {
    /* ignore */
  }

  let latency = "—";
  let tokens = 0;
  let costUsd = 0;
  try {
    const usage = exec.usage_json ? JSON.parse(exec.usage_json) : {};
    const latencyMs = usage.latency_ms ?? (exec.ended_at != null && exec.started_at != null ? exec.ended_at - exec.started_at : null);
    latency = latencyMs != null ? `${latencyMs.toLocaleString()}ms` : "—";
    const prompt = usage.prompt_tokens ?? usage.promptTokens ?? 0;
    const completion = usage.completion_tokens ?? usage.completionTokens ?? 0;
    tokens = (prompt + completion) || (usage.total_tokens ?? usage.totalTokens ?? 0);
    costUsd = usage.cost_usd ?? usage.costUsd ?? 0;
  } catch {
    if (exec.ended_at != null && exec.started_at != null) {
      latency = `${(exec.ended_at - exec.started_at).toLocaleString()}ms`;
    }
  }

  const scenarioName = exec.type === "scenario"
    ? (scenarioById.get(exec.runnable_id)?.title ?? "Unknown scenario")
    : exec.type;

  const status: "success" | "error" = exec.status === "succeeded" ? "success" : "error";
  const timestamp = exec.started_at ? formatRelativeTime(exec.started_at) : "—";

  return {
    id: exec.id ?? exec.runnable_id,
    scenarioName,
    status,
    model,
    latency,
    tokens,
    cost: costUsd > 0 ? `$${costUsd.toFixed(4)}` : "$0.0000",
    timestamp,
  };
}

const PAGE_SIZE = 20;

function Runs() {
  const [dateRange, setDateRange] = useState("Last 24 Hours");
  const [model, setModel] = useState("All Models");
  const [environment, setEnvironment] = useState("Staging");
  const [runs, setRuns] = useState<Run[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadPage = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      const offset = (pageNum - 1) * PAGE_SIZE;
      const [executions, scenarios, total] = await Promise.all([
        listExecutions({ offset, limit: PAGE_SIZE }),
        listScenarios(),
        countExecutions(),
      ]);
      const scenarioById = new Map(scenarios.filter((s): s is Scenario & { id: string } => !!s.id).map((s) => [s.id!, s]));
      const mapped = executions
        .filter((e): e is Execution & { id: string } => !!e.id)
        .map((e) => executionToRun(e, scenarioById));
      setRuns(mapped);
      setTotalRuns(total);
    } catch (err) {
      console.error("Failed to load executions:", err);
      setRuns([]);
      setTotalRuns(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  return (
    <MainContent>
      <Header />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 border-b border-border-light bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 overflow-x-auto">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Filters</span>
            <div className="h-4 w-px bg-slate-300 mx-1"></div>
          </div>
          <div className="flex items-start sm:items-center gap-4 flex-1 flex-wrap">
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-text-muted uppercase mb-1">Date Range</label>
              <select
                className="text-xs font-medium border border-border-light rounded-lg bg-white px-3 py-1.5 focus:ring-primary-500 focus:border-primary-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-text-muted uppercase mb-1">Model</label>
              <select
                className="text-xs font-medium border border-border-light rounded-lg bg-white px-3 py-1.5 focus:ring-primary-500 focus:border-primary-500"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option>All Models</option>
                <option>GPT-4o</option>
                <option>GPT-3.5 Turbo</option>
                <option>Claude 3.5 Sonnet</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-[9px] font-bold text-text-muted uppercase mb-1">Environment</label>
              <div className="flex gap-1">
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${environment === "Production"
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-border-light bg-white hover:bg-slate-50"
                    }`}
                  onClick={() => setEnvironment("Production")}
                >
                  Production
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${environment === "Staging"
                    ? "border-primary-200 bg-primary-50 text-primary-700"
                    : "border-border-light bg-white hover:bg-slate-50"
                    }`}
                  onClick={() => setEnvironment("Staging")}
                >
                  Staging
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text-main transition-colors">
              <Filter className="size-3" />
              More
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-600 hover:underline">
              Clear all
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar min-w-0">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="sticky top-0 bg-white border-b border-border-light z-10">
                <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-16">Status</th>
                <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Scenario Name</th>
                <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Model</th>
                <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Latency</th>
                <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Tokens</th>
                <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Cost</th>
                <th className="px-8 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-sm text-text-muted">
                    Loading runs…
                  </td>
                </tr>
              )}
              {!isLoading && runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-sm text-text-muted">
                    No runs yet. Run a scenario from Studio to see executions here.
                  </td>
                </tr>
              )}
              {!isLoading &&
                runs.map((run) => (
                  <tr key={run.id} className="table-row-hover transition-colors group">
                    <td className="px-8 py-4">
                      {run.status === "success" ? (
                        <CheckCircle className="text-green-500 size-5" />
                      ) : (
                        <XCircle className="text-red-500 size-5" />
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-text-main group-hover:text-primary-600 transition-colors">
                          {run.scenarioName}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted">{run.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700">
                        {run.model}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-mono ${run.latency === "Timeout" ? "text-red-500" : "text-text-main"
                          }`}
                      >
                        {run.latency}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-text-main">{run.tokens.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-text-main">{run.cost}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-xs text-text-muted">{run.timestamp}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <footer className="h-14 min-h-[3.5rem] flex-shrink-0 border-t border-border-light flex items-center">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={totalRuns}
            onPageChange={setPage}
            itemLabel="runs"
          />
        </footer>
      </div>
    </MainContent>
  );
}

export default Runs;
