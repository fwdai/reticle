import { useState, useEffect, useCallback, useRef } from "react";
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
import type { SaveStatus } from "@/components/ui/EditableTitle";
import { createEmptyTool } from "./constants";
import type { Tool } from "./types";
import { ToolsPanel } from "./Panel";
import { ToolDetail } from "./Detail";
import { DetailHeader } from "./Detail/Header";

const DEBOUNCE_MS = 800;

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ id: string; updates: Partial<Tool> } | null>(null);

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

  const flushToolSave = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending || !entityId) return;
    pendingRef.current = null;
    setSaveStatus("saving");
    try {
      if (pending.updates.isShared === false) {
        await unsharedTool(pending.id, entityId);
        const shared = await listSharedTools();
        setSharedTools(shared);
      } else if (pending.updates.isShared === true) {
        await updateToolStorage(pending.id, pending.updates);
        const shared = await listSharedTools();
        setSharedTools(shared);
      } else {
        await updateToolStorage(pending.id, pending.updates);
      }
      setSaveStatus("saved");
    } catch (e) {
      console.warn("Failed to update tool:", e);
      setSaveStatus("unsaved");
    }
  }, [entityId]);

  const updateTool = useCallback(
    (id: string, updates: Partial<Tool>) => {
      setLocalTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      setSaveStatus("unsaved");

      const prev = pendingRef.current;
      pendingRef.current =
        prev && prev.id === id
          ? { id, updates: { ...prev.updates, ...updates } }
          : { id, updates };

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flushToolSave, DEBOUNCE_MS);
    },
    [flushToolSave, setLocalTools]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const removeTool = useCallback(
    async (id: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pendingRef.current = null;
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
          onBack={async () => {
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
              await flushToolSave();
            }
            setSelectedToolId(null);
            setSaveStatus("saved");
          }}
          onRemove={() => removeTool(selectedTool.id)}
        />
        <ToolDetail
          tool={selectedTool}
          showSharedToggle
          autoFocusName={!selectedTool.name}
          usedBy={toolMeta?.usedBy}
          updatedAt={toolMeta?.updatedAt}
          saveStatus={saveStatus}
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
