import { useState, useMemo, useCallback } from "react";

import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { ToolList } from "./List";
import { ToolDetail } from "./ToolDetail";
import type { Category } from "../constants";
import type { RegistryTool } from "../types";

interface ToolsMainContentProps {
  tools: RegistryTool[];
  activeCategory: Category;
  onAddTool: () => string;
  onUpdateTool: (id: string, updates: Partial<RegistryTool>) => void;
  onDeleteTool: (id: string) => void;
}

function ToolsMainContent({
  tools,
  activeCategory,
  onAddTool,
  onUpdateTool,
  onDeleteTool,
}: ToolsMainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTool = tools.find((t) => t.id === selectedId) ?? null;

  const filtered = useMemo(
    () =>
      tools.filter((t) => {
        const matchesSearch =
          !searchQuery ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          activeCategory === "All" || t.category === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [tools, searchQuery, activeCategory]
  );

  const handleCreate = () => {
    const id = onAddTool();
    setSelectedId(id);
  };

  const handleDelete = (id: string) => {
    onDeleteTool(id);
    if (selectedId === id) setSelectedId(null);
  };

  const copyToolSchema = useCallback((tool: RegistryTool) => {
    const schema = {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            tool.parameters.map((p) => [
              p.name,
              { type: p.type, description: p.description },
            ])
          ),
          required: tool.parameters
            .filter((p) => p.required)
            .map((p) => p.name),
        },
      },
    };
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  }, []);

  if (selectedTool) {
    return (
      <ToolDetail
        tool={selectedTool}
        onBack={() => setSelectedId(null)}
        onUpdate={onUpdateTool}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <MainContent>
      <Header
        search={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateTool={handleCreate}
        toolCount={filtered.length}
      />
      <ToolList
        tools={filtered}
        searchQuery={searchQuery}
        onSelectTool={setSelectedId}
        onCreateTool={handleCreate}
        onDeleteTool={handleDelete}
        onCopySchema={copyToolSchema}
      />
    </MainContent>
  );
}

export default ToolsMainContent;
