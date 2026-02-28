import { useState, useMemo, useCallback } from "react";

import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import { SEED_TOOLS, CATEGORIES, createEmptyTool, type Category } from "./constants";
import type { RegistryTool } from "./types";

function ToolsPage() {
  const [tools, setTools] = useState<RegistryTool[]>(SEED_TOOLS);
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      counts[cat] =
        cat === "All"
          ? tools.length
          : tools.filter((t) => t.category === cat).length;
    }
    return counts;
  }, [tools]);

  const addTool = useCallback(() => {
    const newTool = createEmptyTool();
    setTools((prev) => [newTool, ...prev]);
    return newTool.id;
  }, []);

  const updateTool = useCallback(
    (id: string, updates: Partial<RegistryTool>) => {
      setTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  const deleteTool = useCallback((id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <Sidebar
        activeCategory={activeCategory}
        categoryCounts={categoryCounts}
        onCategoryChange={setActiveCategory}
      />
      <MainContent
        tools={tools}
        activeCategory={activeCategory}
        onAddTool={addTool}
        onUpdateTool={updateTool}
        onDeleteTool={deleteTool}
      />
    </>
  );
}

export default ToolsPage;
