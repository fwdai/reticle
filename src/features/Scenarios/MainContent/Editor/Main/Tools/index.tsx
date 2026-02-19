import { useContext, useState, useCallback } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import {
  insertTool,
  updateTool as updateToolStorage,
  deleteTool,
} from "@/lib/storage";
import { createEmptyParam, createEmptyTool } from "./constants";
import { copyToolSchema } from "./utils";
import { normalizeToolFromDb } from "./types";
import type { Tool, ToolParameter } from "./types";
import { ToolsList } from "./List";
import { ToolDetail } from "./Detail";

export default function Tools() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("Tools must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const scenarioId = studioState.scenarioId;
  const rawTools = studioState.currentScenario.tools ?? [];

  const tools: Tool[] = rawTools
    .map((t) => normalizeToolFromDb(t))
    .filter((t): t is Tool => t !== null);

  const setTools = useCallback(
    (updater: (prev: Tool[]) => Tool[]) => {
      setStudioState((prev) => {
        const currentTools = (prev.currentScenario.tools ?? [])
          .map((t) => normalizeToolFromDb(t))
          .filter((t): t is Tool => t !== null);
        const newTools = updater(currentTools);
        return {
          ...prev,
          currentScenario: {
            ...prev.currentScenario,
            tools: newTools,
          },
        };
      });
    },
    [setStudioState]
  );

  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    params: true,
    output: true,
  });

  const selectedTool = tools.find((t) => t.id === selectedToolId);

  const addTool = useCallback(async () => {
    const newTool = createEmptyTool();
    setTools((prev) => [...prev, newTool]);
    setSelectedToolId(newTool.id);
    if (scenarioId) {
      try {
        await insertTool(newTool, scenarioId, rawTools.length);
      } catch (e) {
        console.warn("Failed to persist tool (scenario may not be saved yet):", e);
      }
    }
  }, [scenarioId, rawTools.length, setTools]);

  const updateTool = useCallback(
    async (id: string, updates: Partial<Tool>) => {
      setTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      if (scenarioId) {
        try {
          await updateToolStorage(id, updates);
        } catch (e) {
          console.warn("Failed to persist tool update:", e);
        }
      }
    },
    [scenarioId, setTools]
  );

  const removeTool = useCallback(
    async (id: string) => {
      if (scenarioId) {
        try {
          await deleteTool(id);
        } catch (e) {
          console.warn("Failed to delete tool:", e);
          return;
        }
      }
      setTools((prev) => prev.filter((t) => t.id !== id));
      if (selectedToolId === id) setSelectedToolId(null);
    },
    [scenarioId, selectedToolId, setTools]
  );

  const addParam = useCallback(
    (toolId: string) => {
      setTools((prev) => {
        const newTools = prev.map((t) =>
          t.id === toolId ? { ...t, parameters: [...t.parameters, createEmptyParam()] } : t
        );
        const updated = newTools.find((t) => t.id === toolId);
        if (updated && scenarioId) {
          updateToolStorage(toolId, { parameters: updated.parameters }).catch((e) =>
            console.warn("Failed to persist param add:", e)
          );
        }
        return newTools;
      });
    },
    [scenarioId, setTools]
  );

  const updateParam = useCallback(
    (toolId: string, paramId: string, updates: Partial<ToolParameter>) => {
      setTools((prev) => {
        const newTools = prev.map((t) =>
          t.id === toolId
            ? {
              ...t,
              parameters: t.parameters.map((p) =>
                p.id === paramId ? { ...p, ...updates } : p
              ),
            }
            : t
        );
        const updated = newTools.find((t) => t.id === toolId);
        if (updated && scenarioId) {
          updateToolStorage(toolId, { parameters: updated.parameters }).catch((e) =>
            console.warn("Failed to persist param update:", e)
          );
        }
        return newTools;
      });
    },
    [scenarioId, setTools]
  );

  const removeParam = useCallback(
    (toolId: string, paramId: string) => {
      setTools((prev) => {
        const newTools = prev.map((t) =>
          t.id === toolId
            ? { ...t, parameters: t.parameters.filter((p) => p.id !== paramId) }
            : t
        );
        const updated = newTools.find((t) => t.id === toolId);
        if (updated && scenarioId) {
          updateToolStorage(toolId, { parameters: updated.parameters }).catch((e) =>
            console.warn("Failed to persist param remove:", e)
          );
        }
        return newTools;
      });
    },
    [scenarioId, setTools]
  );

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!selectedTool) {
    return (
      <ToolsList
        tools={tools}
        onAddTool={addTool}
        onSelectTool={setSelectedToolId}
        onRemoveTool={removeTool}
        onCopySchema={copyToolSchema}
      />
    );
  }

  return (
    <ToolDetail
      tool={selectedTool}
      expandedSections={expandedSections}
      onBack={() => setSelectedToolId(null)}
      onUpdateTool={updateTool}
      onRemoveTool={removeTool}
      onAddParam={addParam}
      onUpdateParam={updateParam}
      onRemoveParam={removeParam}
      onToggleSection={toggleSection}
    />
  );
}
