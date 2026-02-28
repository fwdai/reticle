import { ArrowLeft, Copy, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToolSchema } from "../utils";
import type { Tool } from "../types";

interface DetailHeaderProps {
  tool: Tool;
  onBack: () => void;
  onRemove: () => void;
}

export function DetailHeader({ tool, onBack, onRemove }: DetailHeaderProps) {
  return (
    <div className="flex items-center gap-3 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light bg-white text-text-muted hover:text-text-main hover:border-primary/40 transition-all"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Wrench className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-text-main">
          {tool.name || "Untitled Tool"}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-text-muted hover:text-text-main"
          onClick={() => copyToolSchema(tool)}
        >
          <Copy className="h-3 w-3" />
          Copy Schema
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-text-muted hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}
