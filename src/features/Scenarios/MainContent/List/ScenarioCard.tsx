import { FileText, Wrench, Paperclip, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/types";
import type { ScenarioStats } from "./scenarioStats";
import { ScenarioStatusIndicator, type ScenarioStatus } from "./ScenarioStatusIndicator";

interface ScenarioCardProps {
  scenario: Scenario;
  collectionName?: string;
  stats?: ScenarioStats;
  status: ScenarioStatus;
  userPromptHint: string;
  onSelect: () => void;
  onDelete: () => void;
}

export function ScenarioCard({ scenario, collectionName, stats, status, userPromptHint, onSelect, onDelete }: ScenarioCardProps) {
  const toolsCount = stats?.toolsCount ?? 0;
  const attachmentsCount = stats?.attachmentsCount ?? 0;
  const lastRun = stats?.lastRun;

  return (
    <div
      onClick={onSelect}
      className="group relative flex w-full items-center gap-4 rounded-xl border border-border-light bg-white shadow-sm px-5 py-4 text-left transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      {status === "running" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-xl">
          <div
            className="h-full w-1/3 animate-flow-horizontal rounded-full absolute"
            style={{
              background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
            }}
          />
        </div>
      )}

      <div
        className={cn(
          "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300",
          status === "ready" && "bg-primary/10 group-hover:shadow-glow-sm",
          status === "running" && "bg-primary/15 shadow-glow-sm",
          status === "error" && "bg-red-100"
        )}
      >
        <FileText
          className={cn(
            "h-6 w-6",
            status === "ready" && "text-primary",
            status === "running" && "text-primary",
            status === "error" && "text-red-600"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
            {scenario.title}
          </h3>
          {status !== "ready" && <ScenarioStatusIndicator status={status} />}
        </div>
        {userPromptHint ? (
          <p className="text-xs text-text-muted truncate leading-relaxed" title={scenario.user_prompt || undefined}>
            {userPromptHint}
          </p>
        ) : scenario.description ? (
          <p className="text-xs text-text-muted truncate leading-relaxed">
            {scenario.description}
          </p>
        ) : null}
        <div className="flex items-center gap-3 flex-wrap mt-2">
          <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700">
            {scenario.provider}/{scenario.model}
          </span>
          {collectionName && (
            <span className="text-[11px] text-text-muted">{collectionName}</span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
            <Wrench className="h-3 w-3" />
            {toolsCount} tool{toolsCount !== 1 ? "s" : ""}
          </span>
          {attachmentsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
              <Paperclip className="h-3 w-3" />
              {attachmentsCount} file{attachmentsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-6 flex-shrink-0 border-l border-border-light pl-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Last run
          </span>
          <span className="text-xs text-text-main">{lastRun?.timestamp ?? "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Tokens
          </span>
          <span className="text-xs font-mono text-text-main">{lastRun != null ? lastRun.tokens.toLocaleString() : "—"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Cost
          </span>
          <span className="text-xs font-mono text-primary">{lastRun?.cost ?? "—"}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
            <DropdownMenuItem
              className="gap-2 text-xs text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
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
