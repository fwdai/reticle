import type { Tool, ToolParameter } from "../types";
import { DetailHeader } from "./Header";
import { Identity } from "./Identity";
import { MockOutput } from "./MockOutput";
import { Parameters } from "./Parameters";
import { SchemaPreview } from "./SchemaPreview";

interface ToolDetailProps {
  tool: Tool;
  expandedSections: Record<string, boolean>;
  onBack: () => void;
  onUpdateTool: (id: string, updates: Partial<Tool>) => void;
  onRemoveTool: (id: string) => void;
  onAddParam: (toolId: string) => void;
  onUpdateParam: (toolId: string, paramId: string, updates: Partial<ToolParameter>) => void;
  onRemoveParam: (toolId: string, paramId: string) => void;
  onToggleSection: (key: string) => void;
}

export function ToolDetail({
  tool,
  expandedSections,
  onBack,
  onUpdateTool,
  onRemoveTool,
  onAddParam,
  onUpdateParam,
  onRemoveParam,
  onToggleSection,
}: ToolDetailProps) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <DetailHeader
        tool={tool}
        onBack={onBack}
        onRemove={() => onRemoveTool(tool.id)}
      />

      <Identity
        tool={tool}
        onUpdate={(updates) => onUpdateTool(tool.id, updates)}
      />

      <Parameters
        tool={tool}
        expanded={expandedSections.params ?? true}
        onToggle={() => onToggleSection("params")}
        onAddParam={() => onAddParam(tool.id)}
        onUpdateParam={(paramId, updates) => onUpdateParam(tool.id, paramId, updates)}
        onRemoveParam={(paramId) => onRemoveParam(tool.id, paramId)}
      />

      <MockOutput
        tool={tool}
        expanded={expandedSections.output ?? true}
        onToggle={() => onToggleSection("output")}
        onUpdate={(updates) => onUpdateTool(tool.id, updates)}
      />

      <SchemaPreview tool={tool} />
    </div>
  );
}
