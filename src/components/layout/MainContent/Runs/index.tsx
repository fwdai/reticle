import { Filter, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

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

function Runs() {
  const [dateRange, setDateRange] = useState("Last 24 Hours");
  const [model, setModel] = useState("All Models");
  const [environment, setEnvironment] = useState("Staging");

  const runs: Run[] = [
    {
      id: "run_7d2f9a1",
      scenarioName: "Customer Support Routing",
      status: "success",
      model: "gpt-4o",
      latency: "1,245ms",
      tokens: 842,
      cost: "$0.0126",
      timestamp: "Just now",
    },
    {
      id: "run_e3a10b4",
      scenarioName: "Summary Generator V2",
      status: "error",
      model: "claude-3-5",
      latency: "Timeout",
      tokens: 0,
      cost: "$0.0000",
      timestamp: "2 mins ago",
    },
    {
      id: "run_88c2f1e",
      scenarioName: "RAG Semantic Search",
      status: "success",
      model: "gpt-4o",
      latency: "2,410ms",
      tokens: 1529,
      cost: "$0.0229",
      timestamp: "5 mins ago",
    },
    {
      id: "run_2b9d5c1",
      scenarioName: "SQL Query Generator",
      status: "success",
      model: "gpt-3.5-turbo",
      latency: "815ms",
      tokens: 312,
      cost: "$0.0005",
      timestamp: "12 mins ago",
    },
    {
      id: "run_0f3e1a2",
      scenarioName: "Sentiment Analysis Bulk",
      status: "success",
      model: "gpt-4o",
      latency: "4,120ms",
      tokens: 3421,
      cost: "$0.0513",
      timestamp: "24 mins ago",
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-4 sm:px-8 py-4 border-b border-border-light bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 overflow-x-auto">
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
      <div className="flex-1 overflow-x-auto custom-scrollbar min-w-0">
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
            {runs.map((run, index) => (
              <tr
                key={run.id}
                className={`table-row-hover transition-colors group ${index === 2 ? "bg-primary-50/20" : ""
                  }`}
              >
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
      <footer className="h-14 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-8flex-shrink-0">
        <div className="text-xs text-text-muted font-medium">
          Showing <span className="text-text-main">1-25</span> of <span className="text-text-main">1,420</span> runs
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg border border-border-light text-text-muted hover:bg-slate-50 transition-colors">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg bg-primary-600 text-white text-xs font-bold">1</button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-text-muted hover:bg-slate-50">2</button>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-text-muted hover:bg-slate-50">3</button>
            <span className="px-2 text-text-muted">...</span>
            <button className="w-8 h-8 rounded-lg text-xs font-bold text-text-muted hover:bg-slate-50">57</button>
          </div>
          <button className="p-1.5 rounded-lg border border-border-light text-text-muted hover:bg-slate-50 transition-colors">
            <ChevronRight className="size-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default Runs;
