import {
  Play,
  Star,
  MoreVertical,
  Copy,
  Trash2,
  Wrench,
  Brain,
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
import type { Agent } from "./types";
import { StatusIndicator } from "./StatusIndicator";

interface AgentCardProps {
  agent: Agent;
  isStarred: boolean;
  onSelect: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
}

export function AgentCard({ agent, isStarred, onSelect, onToggleStar }: AgentCardProps) {
  return (
    <div
      onClick={onSelect}
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
            isStarred ? "text-amber-500" : "text-text-muted hover:text-amber-500"
          )}
          onClick={onToggleStar}
        >
          <Star className={cn("h-3.5 w-3.5", isStarred && "fill-current")} />
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
  );
}
