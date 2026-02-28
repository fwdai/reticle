import { Wrench, Braces, Zap, Clock, Copy, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ToolWithMeta } from "../../types";

function formatRelativeTime(epoch: number | null): string {
  if (!epoch) return "—";
  const seconds = Math.floor(Date.now() / 1000 - epoch);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ToolCardProps {
  tool: ToolWithMeta;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onCopySchema: (e: React.MouseEvent) => void;
}

export function ToolCard({ tool, onSelect, onDelete, onCopySchema }: ToolCardProps) {
  return (
    <div
      onClick={onSelect}
      className="group relative flex w-full items-center gap-4 rounded-xl border border-border-light bg-white shadow-sm px-5 py-4 text-left transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      {/* Icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:shadow-glow-sm">
        <Wrench className="h-6 w-6 text-primary" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-sm font-semibold font-mono text-text-main truncate group-hover:text-primary transition-colors">
            {tool.name || "untitled"}
          </h3>
        </div>
        <p className="text-xs text-text-muted truncate leading-relaxed mb-2">
          {tool.description || "No description"}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
            <Braces className="h-3 w-3" />
            {tool.parameters.length} param{tool.parameters.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
            <Zap className="h-3 w-3" />
            {tool.usedBy} linked
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden lg:flex items-center gap-6 flex-shrink-0 border-l border-border-light pl-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Params
          </span>
          <span className="text-xs font-mono text-text-main">
            {tool.parameters.filter((p) => p.required).length} required
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Used by
          </span>
          <span className="text-xs text-text-main">
            {tool.usedBy} {tool.usedBy === 1 ? "entity" : "entities"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Updated
          </span>
          <span className="text-xs text-text-main flex items-center gap-1">
            <Clock className="h-3 w-3 text-text-muted" />
            {formatRelativeTime(tool.updatedAt)}
          </span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-text-muted hover:text-primary"
          onClick={onCopySchema}
          title="Copy schema"
        >
          <Copy className="h-3.5 w-3.5" />
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
            <DropdownMenuItem className="gap-2 text-xs" onClick={onCopySchema}>
              <Copy className="h-3.5 w-3.5" />
              Copy Schema
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-xs text-destructive focus:text-destructive"
              onClick={onDelete}
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
