import { useState, useEffect, useCallback, useRef } from "react";
import type { SaveStatus } from "@/components/ui/EditableTitle";

import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { ToolList } from "./List";
import { ToolDetail } from "./ToolDetail";
import { createEmptyTool } from "../constants";
import { copyToolSchema } from "@/components/Tools/utils";
import {
  listSharedToolsWithMeta,
  insertGlobalTool,
  updateTool as updateToolInDb,
  deleteTool as deleteToolFromDb,
} from "@/lib/storage";
import type { Tool, ToolWithMeta } from "../types";

const DEBOUNCE_MS = 800;

function ToolsMainContent() {
  const [tools, setTools] = useState<ToolWithMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ id: string; updates: Partial<Tool> } | null>(null);

  const refreshTools = useCallback(async () => {
    const rows = await listSharedToolsWithMeta();
    setTools(rows);
  }, []);

  useEffect(() => {
    refreshTools();
  }, [refreshTools]);

  const selectedTool = tools.find((t) => t.id === selectedId) ?? null;

  const filtered = tools.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  const flushSave = useCallback(async () => {
    const pending = pendingUpdatesRef.current;
    if (!pending) return;
    pendingUpdatesRef.current = null;
    setSaveStatus("saving");
    try {
      await updateToolInDb(pending.id, pending.updates);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, []);

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Tool>) => {
      setTools((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      setSaveStatus("unsaved");

      const prev = pendingUpdatesRef.current;
      pendingUpdatesRef.current =
        prev && prev.id === id
          ? { id, updates: { ...prev.updates, ...updates } }
          : { id, updates };

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flushSave, DEBOUNCE_MS);
    },
    [flushSave]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleCreate = useCallback(async () => {
    const newTool = createEmptyTool();
    const id = await insertGlobalTool(newTool);
    await refreshTools();
    setSelectedId(id);
    setSaveStatus("saved");
  }, [refreshTools]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pendingUpdatesRef.current = null;
      await deleteToolFromDb(id);
      if (selectedId === id) setSelectedId(null);
      await refreshTools();
    },
    [selectedId, refreshTools]
  );

  const handleBack = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      await flushSave();
    }
    setSelectedId(null);
    setSaveStatus("saved");
    refreshTools();
  }, [flushSave, refreshTools]);

  if (selectedTool) {
    return (
      <ToolDetail
        tool={selectedTool}
        saveStatus={saveStatus}
        onBack={handleBack}
        onUpdate={handleUpdate}
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
