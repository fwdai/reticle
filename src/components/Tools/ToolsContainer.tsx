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
  getToolMeta,
} from "@/lib/storage";
import type { ToolMeta } from "@/lib/storage";
import { createEmptyTool } from "./constants";
import type { Tool } from "./types";
import { ToolsPanel } from "./Panel";
import { ToolDetail } from "./Detail";
import { DetailHeader } from "./Detail/Header";

interface ToolsContainerProps {
  entityId: string | null;
  entityType: "scenario" | "agent";
  onLocalToolsChange?: (tools: Tool[]) => void;
  onEnabledSharedToolIdsChange?: (ids: string[]) => void;
}

export function ToolsContainer({
  entityId,
  entityType,
  onLocalToolsChange,
  onEnabledSharedToolIdsChange,
}: ToolsContainerProps) {
  const [localTools, setLocalToolsState] = useState<Tool[]>([]);
  const [sharedTools, setSharedTools] = useState<Tool[]>([]);
  const [enabledSharedToolIds, setEnabledSharedToolIds] = useState<string[]>(
    []
  );
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [toolMeta, setToolMeta] = useState<ToolMeta | null>(null);

  const setLocalTools = useCallback(
    (updater: (prev: Tool[]) => Tool[]) => {
      setLocalToolsState((prev) => {
        const next = updater(prev);
        onLocalToolsChange?.(next);
        return next;
      });
    },
    [onLocalToolsChange]
  );

  useEffect(() => {
    if (!entityId) return;
    let cancelled = false;

    Promise.all([
      listSharedTools(),
      listToolsForEntity(entityId, entityType),
    ])
      .then(([shared, linked]) => {
        if (cancelled) return;
        const local = linked.filter((t) => !t.isShared);
        const enabledShared = linked.filter((t) => t.isShared).map((t) => t.id);
        setSharedTools(shared);
        setLocalToolsState(local);
        setEnabledSharedToolIds(enabledShared);
        onLocalToolsChange?.(local);
        onEnabledSharedToolIdsChange?.(enabledShared);
      })
      .catch((e) => console.warn("Failed to load tools:", e));

    return () => {
      cancelled = true;
    };
  }, [entityId, entityType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedToolId) {
      setToolMeta(null);
      return;
    }
    getToolMeta(selectedToolId)
      .then(setToolMeta)
      .catch(() => setToolMeta(null));
  }, [selectedToolId]);

  const addTool = useCallback(async () => {
    const newTool = createEmptyTool();
    setLocalTools((prev) => [...prev, newTool]);
    setSelectedToolId(newTool.id);
    if (entityId) {
      try {
        await insertTool(newTool, entityId, entityType, localTools.length);
      } catch (e) {
        console.warn("Failed to persist new tool:", e);
      }
    }
  }, [entityId, entityType, localTools.length, setLocalTools]);

  const updateTool = useCallback(
    async (id: string, updates: Partial<Tool>) => {
      setLocalTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
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
    },
    [entityId, setLocalTools]
  );

  const removeTool = useCallback(
    async (id: string) => {
      if (entityId) {
        try {
          await deleteTool(id);
        } catch (e) {
          console.warn("Failed to delete tool:", e);
          return;
        }
      }
      setLocalTools((prev) => prev.filter((t) => t.id !== id));
      if (selectedToolId === id) setSelectedToolId(null);
    },
    [entityId, selectedToolId, setLocalTools]
  );

  const toggleSharedTool = useCallback(
    async (toolId: string) => {
      if (!entityId) return;
      const isEnabled = enabledSharedToolIds.includes(toolId);
      setEnabledSharedToolIds((prev) => {
        const next = isEnabled
          ? prev.filter((id) => id !== toolId)
          : [...prev, toolId];
        onEnabledSharedToolIdsChange?.(next);
        return next;
      });
      try {
        if (isEnabled) {
          await unlinkTool(toolId, entityId, entityType);
        } else {
          await linkTool(toolId, entityId, entityType);
        }
      } catch (e) {
        console.warn("Failed to toggle shared tool:", e);
      }
    },
    [entityId, entityType, enabledSharedToolIds] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const selectedTool = localTools.find((t) => t.id === selectedToolId);

  if (selectedTool) {
    return (
      <div className="space-y-4">
        <DetailHeader
          tool={selectedTool}
          onBack={() => setSelectedToolId(null)}
          onRemove={() => removeTool(selectedTool.id)}
        />
        <ToolDetail
          tool={selectedTool}
          showSharedToggle
          autoFocusName={!selectedTool.name}
          usedBy={toolMeta?.usedBy}
          updatedAt={toolMeta?.updatedAt}
          onUpdate={updateTool}
        />
      </div>
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
