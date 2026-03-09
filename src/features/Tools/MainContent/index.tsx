import { useState, useEffect, useCallback, useRef } from "react";
import type { SaveStatus } from "@/components/ui/EditableTitle";

import MainContent from "@/components/Layout/MainContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ToolFilterId } from "../index";

const DEBOUNCE_MS = 800;

interface ToolsMainContentProps {
  filter: ToolFilterId;
}

function ToolsMainContent({ filter }: ToolsMainContentProps) {
  const [tools, setTools] = useState<ToolWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ id: string; updates: Partial<Tool> } | null>(null);

  const refreshTools = useCallback(async () => {
    const rows = await listSharedToolsWithMeta();
    setTools(rows);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshTools();
  }, [refreshTools]);

  useEffect(() => {
    setSelectedId(null);
  }, [filter]);

  const selectedTool = tools.find((t) => t.id === selectedId) ?? null;

  const filtered = tools.filter((t) => {
    if (filter === "json" && t.mockMode !== "json") return false;
    if (filter === "code" && t.mockMode !== "code") return false;
    if (filter === "unused" && t.usedBy > 0) return false;
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

  const [toolToDelete, setToolToDelete] = useState<ToolWithMeta | null>(null);

  const handleDeleteClick = useCallback(
    (id: string) => {
      const tool = tools.find((t) => t.id === id);
      if (tool) setToolToDelete(tool);
    },
    [tools]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!toolToDelete) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingUpdatesRef.current = null;
    await deleteToolFromDb(toolToDelete.id);
    if (selectedId === toolToDelete.id) setSelectedId(null);
    setToolToDelete(null);
    await refreshTools();
  }, [toolToDelete, selectedId, refreshTools]);

  const handleDelete = handleDeleteClick;

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
        isEmpty={tools.length === 0}
      />
      {isLoading ? null : (
        <ToolList
          tools={filtered}
          hasTools={tools.length > 0}
          searchQuery={searchQuery}
          onSelectTool={setSelectedId}
          onCreateTool={handleCreate}
          onDeleteTool={handleDelete}
          onCopySchema={copyToolSchema}
        />
      )}
      <Dialog open={!!toolToDelete} onOpenChange={(open) => !open && setToolToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete tool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{toolToDelete?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToolToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainContent>
  );
}

export default ToolsMainContent;
