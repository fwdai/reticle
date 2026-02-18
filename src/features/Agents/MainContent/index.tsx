import { useState } from "react";
import { AgentDetail, type AgentDetailAgent } from "./AgentDetail";
import {
  Search,
  Play,
  Star,
  MoreVertical,
  Copy,
  Trash2,
  Wrench,
  Brain,
  Loader2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import MainContent from "@/components/Layout/MainContent";
import Header, { type SortKey } from "../Header";

type AgentStatus = "ready" | "needs-config" | "error" | "running";

interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  model: string;
  toolsCount: number;
  memoryEnabled: boolean;
  starred: boolean;
  lastRun?: {
    timestamp: string;
    duration: string;
    tokens: string;
    cost: string;
  };
}

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Customer Support Agent",
    description: "Routes and resolves customer inquiries across channels with context-aware responses",
    status: "ready",
    model: "gpt-4.1",
    toolsCount: 5,
    memoryEnabled: true,
    starred: true,
    lastRun: { timestamp: "2h ago", duration: "4.2s", tokens: "2.3k", cost: "$0.014" },
  },
  {
    id: "2",
    name: "Code Review Agent",
    description: "Automated PR review with security analysis, performance checks, and style enforcement",
    status: "running",
    model: "claude-3.5",
    toolsCount: 3,
    memoryEnabled: true,
    starred: false,
    lastRun: { timestamp: "now", duration: "12.1s", tokens: "5.8k", cost: "$0.042" },
  },
  {
    id: "3",
    name: "Data Pipeline Analyst",
    description: "Monitors data quality, detects anomalies, and generates insight reports from structured data",
    status: "needs-config",
    model: "gpt-4o",
    toolsCount: 7,
    memoryEnabled: false,
    starred: false,
    lastRun: { timestamp: "1d ago", duration: "8.7s", tokens: "4.1k", cost: "$0.028" },
  },
  {
    id: "4",
    name: "Incident Response Bot",
    description: "Triages production alerts, correlates logs, and executes runbooks automatically",
    status: "error",
    model: "gpt-4.1",
    toolsCount: 4,
    memoryEnabled: true,
    starred: true,
    lastRun: { timestamp: "6h ago", duration: "2.1s", tokens: "1.2k", cost: "$0.008" },
  },
];

function StatusIndicator({ status }: { status: AgentStatus }) {
  return (
    <div className="flex items-center gap-2">
      {status === "ready" && (
        <>
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-semibold tracking-wide text-green-600 uppercase">Ready</span>
        </>
      )}
      {status === "needs-config" && (
        <>
          <span className="size-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-semibold tracking-wide text-amber-600 uppercase">Needs config</span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="size-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold tracking-wide text-red-600 uppercase">Error</span>
        </>
      )}
      {status === "running" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">Running</span>
        </>
      )}
    </div>
  );
}

function AgentsMainContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [starredAgents, setStarredAgents] = useState<Set<string>>(
    new Set(mockAgents.filter((a) => a.starred).map((a) => a.id))
  );

  const filteredAgents = mockAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredAgents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
    const agent = mockAgents.find((a) => a.id === agentId);
    if (agent) setSelectedAgent(agent);
  };

  const handleBackFromDetail = () => {
    setSelectedAgent(null);
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
      <AgentDetail agent={detailAgent} onBack={handleBackFromDetail} />
    );
  }

  return (
    <MainContent>
      <Header
        search={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onCreateAgent={handleCreateAgent}
        agentCount={filteredAgents.length}
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Search className="h-7 w-7 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-main mb-1">No agents found</p>
            <p className="text-xs text-text-muted">Try a different search term or create a new agent</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleSelectAgent(agent.id)}
                className="group relative flex w-full items-center gap-4 rounded-xl border border-border-light bg-white shadow-sm px-5 py-4 text-left transition-all duration-200 hover:border-slate-300 cursor-pointer"
              >
                {/* Running state: animated top border */}
                {agent.status === "running" && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-xl">
                    <div
                      className="h-full w-1/3 animate-flow-horizontal rounded-full absolute"
                      style={{
                        background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                      }}
                    />
                  </div>
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                    agent.status === "ready" && "bg-primary/10 group-hover:shadow-glow-sm",
                    agent.status === "running" && "bg-primary/15 shadow-glow-sm",
                    agent.status === "needs-config" && "bg-amber-100",
                    agent.status === "error" && "bg-red-100"
                  )}
                >
                  <Zap
                    className={cn(
                      "h-6 w-6",
                      agent.status === "ready" && "text-primary",
                      agent.status === "running" && "text-primary",
                      agent.status === "needs-config" && "text-amber-600",
                      agent.status === "error" && "text-red-600"
                    )}
                  />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                    <StatusIndicator status={agent.status} />
                  </div>
                  <p className="text-xs text-text-muted truncate leading-relaxed mb-2">
                    {agent.description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700">
                      {agent.model}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                      <Wrench className="h-3 w-3" />
                      {agent.toolsCount} tools
                    </span>
                    {agent.memoryEnabled && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-primary/80">
                        <Brain className="h-3 w-3" />
                        Memory on
                      </span>
                    )}
                  </div>
                </div>

                {/* Last run metrics */}
                {agent.lastRun && (
                  <div className="hidden lg:flex items-center gap-6 flex-shrink-0 border-l border-border-light pl-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Last run
                      </span>
                      <span className="text-xs text-text-main">{agent.lastRun.timestamp}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Duration
                      </span>
                      <span className="text-xs font-mono text-text-main">{agent.lastRun.duration}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Tokens
                      </span>
                      <span className="text-xs font-mono text-text-main">{agent.lastRun.tokens}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        Cost
                      </span>
                      <span className="text-xs font-mono text-primary">{agent.lastRun.cost}</span>
                    </div>
                  </div>
                )}

                {/* Hover actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-muted hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 transition-colors",
                      starredAgents.has(agent.id) ? "text-amber-500" : "text-text-muted hover:text-amber-500"
                    )}
                    onClick={(e) => toggleStar(agent.id, e)}
                  >
                    <Star
                      className={cn("h-3.5 w-3.5", starredAgents.has(agent.id) && "fill-current")}
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-text-muted hover:text-text-main"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                        <Copy className="h-3.5 w-3.5" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-xs text-destructive focus:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainContent>
  );
}

export default AgentsMainContent;
