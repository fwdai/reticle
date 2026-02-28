import { useState } from "react";
import { Globe, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { SearchField } from "@/components/ui/SearchField";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle } from "./constants";
import type { Tool } from "./types";

type ViewMode = "local" | "shared";

interface ToolsPanelProps {
  localTools: Tool[];
  sharedTools: Tool[];
  enabledSharedToolIds: string[];
  onAddTool?: () => void;
  onSelectTool?: (id: string) => void;
  onRemoveTool?: (id: string) => void;
  onToggleSharedTool: (toolId: string) => void;
}

export function ToolsPanel({
  localTools,
  sharedTools,
  enabledSharedToolIds,
  onAddTool,
  onSelectTool,
  onRemoveTool,
  onToggleSharedTool,
}: ToolsPanelProps) {
  const [view, setView] = useState<ViewMode>("shared");
  const [search, setSearch] = useState("");

  const totalCount = localTools.length + enabledSharedToolIds.length;

  const filteredShared = sharedTools.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    );
  });

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
        <div className="flex items-center gap-2">
          {view === "local" && onAddTool && (
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
          <SegmentedSwitch
            size="section"
            options={[
              { value: "shared" as ViewMode, label: "Shared" },
              { value: "local" as ViewMode, label: "Local" },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      </div>

      {view === "local" ? (
        <div className="p-4">
          {localTools.length === 0 ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {localTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onClick={onSelectTool ? () => onSelectTool(tool.id) : undefined}
                  onEdit={onSelectTool ? () => onSelectTool(tool.id) : undefined}
                  onRemove={onRemoveTool ? () => onRemoveTool(tool.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-4 pt-3 pb-2">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search shared tools…"
              className="w-full"
              inputClassName="w-full sm:w-full"
            />
          </div>

          <div className="p-4 pt-1">
            {sharedTools.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-text-muted">
                  <Globe className="h-5 w-5" />
                </div>
                <p className="mb-1 text-sm font-medium text-text-main">No shared tools yet</p>
                <p className="max-w-[240px] text-xs text-text-muted">
                  Mark a tool as shared to make it available across scenarios and agents.
                </p>
              </div>
            ) : filteredShared.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-text-muted">No tools match "{search}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredShared.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isShared
                    isEnabled={enabledSharedToolIds.includes(tool.id)}
                    onClick={() => onToggleSharedTool(tool.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolCardProps {
  tool: Tool;
  isShared?: boolean;
  isEnabled?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}

function ToolCard({ tool, isShared, isEnabled = true, onClick, onEdit, onRemove }: ToolCardProps) {
  const active = !isShared || isEnabled;

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border p-3 transition-all",
        onClick && "cursor-pointer",
        active
          ? "border-primary/30 bg-primary/5 hover:border-primary/50"
          : "border-border-light bg-white hover:border-slate-300"
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 transition-colors",
          active ? "bg-primary/15 text-primary" : "bg-slate-100 text-text-muted"
        )}
      >
        <Wrench className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold text-text-main truncate">
            {tool.name || "Untitled"}
          </p>
        </div>
        <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
          {tool.description || "No description"}
        </p>
      </div>

      {(onEdit || onRemove) && (
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
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
      )}
    </div>
  );
}
