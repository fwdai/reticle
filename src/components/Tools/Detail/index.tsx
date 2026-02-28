import { useState } from "react";
import { createEmptyParam } from "../constants";
import type { Tool, ToolParameter } from "../types";
import { Definition } from "./Definition";
import { Input } from "./Input";
import { Output } from "./Output";
import { SchemaPreview } from "./SchemaPreview";
import { Usage } from "./Usage";

interface ToolDetailProps {
  tool: Tool;
  showSharedToggle?: boolean;
  autoFocusName?: boolean;
  usedBy?: number;
  updatedAt?: number | null;
  onUpdate: (id: string, updates: Partial<Tool>) => void;
}

export function ToolDetail({
  tool,
  showSharedToggle = false,
  autoFocusName = false,
  usedBy,
  updatedAt,
  onUpdate,
}: ToolDetailProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ params: true, output: true });

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const addParam = () =>
    onUpdate(tool.id, {
      parameters: [...tool.parameters, createEmptyParam()],
    });

  const updateParam = (paramId: string, updates: Partial<ToolParameter>) =>
    onUpdate(tool.id, {
      parameters: tool.parameters.map((p) =>
        p.id === paramId ? { ...p, ...updates } : p
      ),
    });

  const removeParam = (paramId: string) =>
    onUpdate(tool.id, {
      parameters: tool.parameters.filter((p) => p.id !== paramId),
    });

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Definition
        tool={tool}
        showSharedToggle={showSharedToggle}
        autoFocusName={autoFocusName}
        onUpdate={(updates) => onUpdate(tool.id, updates)}
      />

      <Input
        tool={tool}
        expanded={expandedSections.params ?? true}
        onToggle={() => toggleSection("params")}
        onAddParam={addParam}
        onUpdateParam={updateParam}
        onRemoveParam={removeParam}
      />

      <Output
        tool={tool}
        expanded={expandedSections.output ?? true}
        onToggle={() => toggleSection("output")}
        onUpdate={(updates) => onUpdate(tool.id, updates)}
      />

      <SchemaPreview tool={tool} />

      {usedBy !== undefined && (
        <Usage usedBy={usedBy} updatedAt={updatedAt ?? null} />
      )}
    </div>
  );
}
