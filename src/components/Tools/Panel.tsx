import { Globe, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "./constants";
import type { Tool } from "./types";

interface ToolsPanelProps {
  /** Non-global tools owned by this entity */
  localTools: Tool[];
  /** All global tools in the system */
  globalTools: Tool[];
  /** Which global tool IDs are currently enabled for this entity */
  enabledGlobalToolIds: string[];
  /** If provided, renders "Add Tool" button in header */
  onAddTool?: () => void;
  /** If provided, local tool cards navigate to the editor on click */
  onSelectTool?: (id: string) => void;
  /** If provided, shows delete button on local tool cards */
  onRemoveTool?: (id: string) => void;
  /** Toggle a global tool on/off for this entity */
  onToggleGlobalTool: (toolId: string) => void;
}

export function ToolsPanel({
  localTools,
  globalTools,
  enabledGlobalToolIds,
  onAddTool,
  onSelectTool,
  onRemoveTool,
  onToggleGlobalTool,
}: ToolsPanelProps) {
  const hasAnyTools = localTools.length > 0 || globalTools.length > 0;
  const totalCount = localTools.length + enabledGlobalToolIds.length;

  return (
    <div className={panelBase}>
      {/* Header */}
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-text-muted" />
          <span className={panelTitle}>Tools</span>
          {totalCount > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
              {totalCount}
            </span>
          )}
        </div>
        {onAddTool && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10"
            onClick={onAddTool}
          >
            <Plus className="h-3 w-3" />
            ADD TOOL
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Empty state */}
        {!hasAnyTools && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <p className="mb-1 text-sm font-medium text-text-main">No tools configured</p>
            <p className="mb-5 max-w-[260px] text-xs text-text-muted">
              Define function calling tools for the LLM. Specify input schema and mock
              outputs to test tool calling behavior.
            </p>
            {onAddTool && (
              <Button
                size="sm"
                className="h-9 gap-1.5 font-medium px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm"
                onClick={onAddTool}
              >
                <Plus className="h-3.5 w-3.5" />
                Create First Tool
              </Button>
            )}
          </div>
        )}

        {/* Local tools */}
        {localTools.length > 0 && (
          <div className="space-y-2">
            {localTools.length > 0 && globalTools.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
                My Tools
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {localTools.map((tool) => (
                <LocalToolCard
                  key={tool.id}
                  tool={tool}
                  onSelect={onSelectTool ? () => onSelectTool(tool.id) : undefined}
                  onRemove={onRemoveTool ? () => onRemoveTool(tool.id) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {/* Global tools */}
        {globalTools.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Global Tools
              </p>
              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                {enabledGlobalToolIds.length}/{globalTools.length} ENABLED
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {globalTools.map((tool) => {
                const isEnabled = enabledGlobalToolIds.includes(tool.id);
                return (
                  <GlobalToolCard
                    key={tool.id}
                    tool={tool}
                    isEnabled={isEnabled}
                    onToggle={() => onToggleGlobalTool(tool.id)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface LocalToolCardProps {
  tool: Tool;
  onSelect?: () => void;
  onRemove?: () => void;
}

function LocalToolCard({ tool, onSelect, onRemove }: LocalToolCardProps) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 transition-all",
        onSelect && "cursor-pointer hover:border-primary/50 hover:bg-primary/8"
      )}
      onClick={onSelect}
    >
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary mt-0.5">
        <Wrench className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-text-main truncate">
          {tool.name || "Untitled"}
        </p>
        <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
          {tool.description || "No description"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
            {tool.parameters.length} PARAM{tool.parameters.length !== 1 ? "S" : ""}
          </span>
          {tool.mockMode === "code" && (
            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold text-warning">
              CODE
            </span>
          )}
        </div>
      </div>

      {/* Action buttons (shown on hover) */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
        {onSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="flex h-6 w-6 items-center justify-center rounded bg-white border border-border-light text-text-muted hover:text-primary transition-all"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex h-6 w-6 items-center justify-center rounded bg-white border border-border-light text-text-muted hover:text-destructive transition-all"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

interface GlobalToolCardProps {
  tool: Tool;
  isEnabled: boolean;
  onToggle: () => void;
}

function GlobalToolCard({ tool, isEnabled, onToggle }: GlobalToolCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200",
        isEnabled
          ? "border-primary/40 bg-primary/5"
          : "border-border-light bg-white hover:border-slate-300"
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 transition-colors",
          isEnabled ? "bg-primary/15 text-primary" : "bg-slate-100 text-text-muted"
        )}
      >
        <Globe className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs font-semibold truncate",
            isEnabled ? "text-text-main" : "text-text-main/80"
          )}
        >
          {tool.name || "Untitled"}
        </p>
        <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
          {tool.description || "No description"}
        </p>
      </div>
      {/* Mini toggle indicator */}
      <div
        className={cn(
          "relative h-4 w-7 rounded-full flex-shrink-0 mt-1 transition-colors",
          isEnabled ? "bg-primary" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
            isEnabled ? "left-3.5" : "left-0.5"
          )}
        />
      </div>
    </button>
  );
}
