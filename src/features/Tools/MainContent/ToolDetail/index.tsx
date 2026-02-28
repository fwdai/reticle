import { ArrowLeft, Copy, Trash2 } from "lucide-react";
import MainContent from "@/components/Layout/MainContent";
import LayoutHeader from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { EditableTitle, type SaveStatus } from "@/components/ui/EditableTitle";
import { ToolDetail as ToolDetailBody } from "@/components/Tools/Detail";
import { copyToolSchema } from "@/components/Tools/utils";
import type { Tool } from "../../types";
import type { ToolWithMeta } from "../../types";

interface ToolDetailProps {
  tool: ToolWithMeta;
  saveStatus: SaveStatus;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Tool>) => void;
  onDelete: (id: string) => void;
}

export function ToolDetail({
  tool,
  saveStatus,
  onBack,
  onUpdate,
  onDelete,
}: ToolDetailProps) {
  return (
    <MainContent>
      <LayoutHeader>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tools
          </button>
          <div className="h-5 w-px bg-border-light" />
          <EditableTitle
            value={tool.name}
            onChange={(name) => onUpdate(tool.id, { name })}
            placeholder="Name your tool..."
            saveStatus={saveStatus}
            autoFocus={!tool.name}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs"
            onClick={() => copyToolSchema(tool)}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Schema
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(tool.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </LayoutHeader>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
        <ToolDetailBody
          tool={tool}
          usedBy={tool.usedBy}
          updatedAt={tool.updatedAt}
          onUpdate={onUpdate}
        />
      </div>
    </MainContent>
  );
}
