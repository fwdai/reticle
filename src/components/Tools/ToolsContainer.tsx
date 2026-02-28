import { useState, useEffect, useCallback } from "react";
import {
  insertTool,
  updateTool as updateToolStorage,
  deleteTool,
  listSharedTools,
  listToolsForEntity,
  linkTool,
  unlinkTool,
  unsharedTool,
} from "@/lib/storage";
import { createEmptyTool, createEmptyParam } from "./constants";
import type { Tool, ToolParameter } from "./types";
import { ToolsPanel } from "./Panel";
import { ToolDetail } from "./Detail";

interface ToolsContainerProps {
  entityId: string | null;
  entityType: "scenario" | "agent";
  /**
   * Called whenever the local (non-shared) tools list changes.
   * Use this to sync tools into parent state (e.g. StudioContext).
   */
  onLocalToolsChange?: (tools: Tool[]) => void;
}

/**
 * Self-contained tool management panel.
 * Loads tools from DB, handles all CRUD, and manages panel ↔ detail view state.
 * Used in both the Scenario tools tab and the Agent spec.
 */
export function ToolsContainer({
  entityId,
  entityType,
  onLocalToolsChange,
}: ToolsContainerProps) {
  const [localTools, setLocalToolsState] = useState<Tool[]>([]);
  const [sharedTools, setSharedTools] = useState<Tool[]>([]);
  const [enabledSharedToolIds, setEnabledSharedToolIds] = useState<string[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    params: true,
    output: true,
  });

  // Keep local state + notify parent
  const setLocalTools = useCallback((updater: (prev: Tool[]) => Tool[]) => {
    setLocalToolsState(prev => {
      const next = updater(prev);
      onLocalToolsChange?.(next);
      return next;
    });
  }, [onLocalToolsChange]);

  // Load tools from DB whenever entityId changes
  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;

    Promise.all([
      listSharedTools(),
      listToolsForEntity(entityId, entityType),
    ]).then(([shared, linked]) => {
      if (cancelled) return;
      const local = linked.filter(t => !t.isShared);
      const enabledShared = linked.filter(t => t.isShared).map(t => t.id);
      setSharedTools(shared);
      setLocalToolsState(local);
      setEnabledSharedToolIds(enabledShared);
      onLocalToolsChange?.(local);
    }).catch(e => console.warn("Failed to load tools:", e));

    return () => { cancelled = true; };
  }, [entityId, entityType]); // intentionally exclude onLocalToolsChange

  const addTool = useCallback(async () => {
    const newTool = createEmptyTool();
    setLocalTools(prev => [...prev, newTool]);
    setSelectedToolId(newTool.id);
    if (entityId) {
      try {
        await insertTool(newTool, entityId, entityType, localTools.length);
      } catch (e) {
        console.warn("Failed to persist new tool:", e);
      }
    }
  }, [entityId, entityType, localTools.length, setLocalTools]);

  const updateTool = useCallback(async (id: string, updates: Partial<Tool>) => {
    setLocalTools(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (!entityId) return;
    try {
      if (updates.isShared === false) {
        await unsharedTool(id, entityId);
        const shared = await listSharedTools();
        setSharedTools(shared);
      } else if (updates.isShared === true) {
        await updateToolStorage(id, updates);
        const shared = await listSharedTools();
        setSharedTools(shared);
      } else {
        await updateToolStorage(id, updates);
      }
    } catch (e) {
      console.warn("Failed to update tool:", e);
    }
  }, [entityId, setLocalTools]);

  const removeTool = useCallback(async (id: string) => {
    if (entityId) {
      try {
        await deleteTool(id);
      } catch (e) {
        console.warn("Failed to delete tool:", e);
        return;
      }
    }
    setLocalTools(prev => prev.filter(t => t.id !== id));
    if (selectedToolId === id) setSelectedToolId(null);
  }, [entityId, selectedToolId, setLocalTools]);

  const addParam = useCallback((toolId: string) => {
    setLocalTools(prev => {
      const next = prev.map(t =>
        t.id === toolId ? { ...t, parameters: [...t.parameters, createEmptyParam()] } : t
      );
      const updated = next.find(t => t.id === toolId);
      if (updated && entityId) {
        updateToolStorage(toolId, { parameters: updated.parameters }).catch(e =>
          console.warn("Failed to persist param add:", e)
        );
      }
      return next;
    });
  }, [entityId, setLocalTools]);

  const updateParam = useCallback((toolId: string, paramId: string, updates: Partial<ToolParameter>) => {
    setLocalTools(prev => {
      const next = prev.map(t =>
        t.id === toolId
          ? { ...t, parameters: t.parameters.map(p => p.id === paramId ? { ...p, ...updates } : p) }
          : t
      );
      const updated = next.find(t => t.id === toolId);
      if (updated && entityId) {
        updateToolStorage(toolId, { parameters: updated.parameters }).catch(e =>
          console.warn("Failed to persist param update:", e)
        );
      }
      return next;
    });
  }, [entityId, setLocalTools]);

  const removeParam = useCallback((toolId: string, paramId: string) => {
    setLocalTools(prev => {
      const next = prev.map(t =>
        t.id === toolId
          ? { ...t, parameters: t.parameters.filter(p => p.id !== paramId) }
          : t
      );
      const updated = next.find(t => t.id === toolId);
      if (updated && entityId) {
        updateToolStorage(toolId, { parameters: updated.parameters }).catch(e =>
          console.warn("Failed to persist param remove:", e)
        );
      }
      return next;
    });
  }, [entityId, setLocalTools]);

  const toggleSharedTool = useCallback(async (toolId: string) => {
    if (!entityId) return;
    const isEnabled = enabledSharedToolIds.includes(toolId);
    setEnabledSharedToolIds(prev => isEnabled ? prev.filter(id => id !== toolId) : [...prev, toolId]);
    try {
      if (isEnabled) {
        await unlinkTool(toolId, entityId, entityType);
      } else {
        await linkTool(toolId, entityId, entityType);
      }
    } catch (e) {
      console.warn("Failed to toggle shared tool:", e);
    }
  }, [entityId, entityType, enabledSharedToolIds]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedTool = localTools.find(t => t.id === selectedToolId);

  if (selectedTool) {
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

  return (
    <ToolsPanel
      localTools={localTools}
      sharedTools={sharedTools}
      enabledSharedToolIds={enabledSharedToolIds}
      onAddTool={addTool}
      onSelectTool={setSelectedToolId}
      onRemoveTool={removeTool}
      onToggleSharedTool={toggleSharedTool}
    />
  );
}
