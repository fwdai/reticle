import { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import MainContent from '@/components/Layout/MainContent';
import { StudioContext } from '@/contexts/StudioContext';

import Header from '../Header';
import ListHeader from '../ListHeader';
import Editor from './Editor';
import Test from './Test';
import Visualizer from './Visualizer';
import { ScenarioList } from './List';
import { fetchScenarioStats, type ScenarioStats } from './List/scenarioStats';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Scenario } from '@/types';
import type { ScenarioStarterConfig } from '@/constants/starterTemplates';
import type { ScenarioConfigExport } from '@/lib/evals';

function Studio() {
  const context = useContext(StudioContext);
  const viewMode = context?.viewMode ?? 'editor';
  const [searchQuery, setSearchQuery] = useState('');
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);

  const {
    studioState,
    selectedCollectionId,
    loadScenario,
    createScenario,
    createCollection,
    deleteScenario,
    runScenarioById,
  } = context ?? {};

  const { savedScenarios, collections, scenarioId, currentScenario, isLoading, currentExecutionId } = studioState ?? {
    savedScenarios: [], collections: [], scenarioId: null, currentScenario: { id: "" }, isLoading: false, currentExecutionId: null,
  };

  const filteredScenarios = useMemo(() => {
    let list = selectedCollectionId
      ? savedScenarios.filter((s) => s.collection_id === selectedCollectionId)
      : savedScenarios;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.description ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [savedScenarios, selectedCollectionId, searchQuery]);

  const collectionNames = useMemo(
    () => Object.fromEntries(collections.map((c) => [c.id!, c.name])),
    [collections]
  );

  const [scenarioStats, setScenarioStats] = useState<Record<string, ScenarioStats>>({});

  const scenarioStatusMap = useMemo(() => {
    type Status = "ready" | "running" | "error";
    const map: Record<string, Status> = {};
    const isRunning = (id: string) =>
      id === currentScenario?.id && !!isLoading && !!currentExecutionId;
    filteredScenarios.forEach((s) => {
      if (!s.id) return;
      if (isRunning(s.id)) {
        map[s.id] = "running";
      } else if (scenarioStats[s.id]?.lastRun?.status === "failed") {
        map[s.id] = "error";
      } else {
        map[s.id] = "ready";
      }
    });
    return map;
  }, [filteredScenarios, currentScenario?.id, isLoading, currentExecutionId, scenarioStats]);

  useEffect(() => {
    if (filteredScenarios.length === 0) {
      setScenarioStats({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      const results = await Promise.all(
        filteredScenarios.map(async (s) => {
          if (!s.id) return null;
          const stats = await fetchScenarioStats(s.id);
          return { id: s.id, stats };
        })
      );
      if (cancelled) return;
      const map: Record<string, ScenarioStats> = {};
      filteredScenarios.forEach((s, i) => {
        if (s.id && results[i]) {
          map[s.id] = results[i]!.stats;
        }
      });
      setScenarioStats(map);
    };
    load();
    return () => { cancelled = true; };
  }, [filteredScenarios, isLoading]);

  const handleImportScenario = async (config: ScenarioConfigExport) => {
    const variables_json = JSON.stringify({
      system: config.systemVariables.map((v) => ({ id: crypto.randomUUID(), key: v.key, value: v.value })),
      user: config.userVariables.map((v) => ({ id: crypto.randomUUID(), key: v.key, value: v.value })),
    });
    await handleCreateScenario({
      title: config.name,
      system_prompt: config.systemPrompt,
      user_prompt: config.userPrompt,
      variables_json,
    });
  };

  const handleCreateScenario = async (config?: ScenarioStarterConfig) => {
    if (selectedCollectionId) {
      await createScenario?.(selectedCollectionId, config);
      return;
    }
    // No collection selected — reuse an existing "Default" collection or create one
    const existing = collections.find((c) => c.name === "Default");
    const collectionId = existing?.id ?? await createCollection?.("Default");
    if (collectionId) {
      await createScenario?.(collectionId, config);
    }
  };

  const handleDeleteClick = (scenario: Scenario) => setScenarioToDelete(scenario);

  const handleDeleteCurrentScenario = useCallback(() => {
    const s = savedScenarios.find((s) => s.id === scenarioId);
    if (s) setScenarioToDelete(s);
  }, [savedScenarios, scenarioId]);

  const handleConfirmDelete = async () => {
    if (!scenarioToDelete) return;
    await deleteScenario?.(scenarioToDelete.id!);
    setScenarioToDelete(null);
  };

  const isListViewModel = scenarioId === null;

  const deleteDialog = (
    <Dialog open={!!scenarioToDelete} onOpenChange={(open) => !open && setScenarioToDelete(null)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete scenario</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{scenarioToDelete?.title}&quot;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setScenarioToDelete(null)}>
            Cancel
          </Button>
          <Button data-testid="confirm-delete" variant="destructive" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isListViewModel) {
    return (
      <>
        <MainContent>
          <ListHeader
            title={selectedCollectionId ? (collectionNames[selectedCollectionId] ?? "Collection") : "All Scenarios"}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateScenario={handleCreateScenario}
            onImportScenario={handleImportScenario}
            scenarioCount={filteredScenarios.length}
            canCreate={true}
            isEmpty={savedScenarios.length === 0}
          />
          {isLoading && savedScenarios.length === 0 ? null : (
            <ScenarioList
              scenarios={filteredScenarios}
              collectionNames={collectionNames}
              scenarioStats={scenarioStats}
              scenarioStatusMap={scenarioStatusMap}
              onSelectScenario={(id) => loadScenario?.(id)}
              onRunScenario={(id) => runScenarioById?.(id)}
              onDeleteScenario={handleDeleteClick}
              hasCollectionSelected={selectedCollectionId !== null}
              hasScenarios={savedScenarios.length > 0}
              hasSearch={!!searchQuery.trim()}
              onCreateScenario={handleCreateScenario}
            />
          )}
        </MainContent>
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <MainContent>
        <Header onDelete={handleDeleteCurrentScenario} />
        {viewMode === 'editor' && <Editor />}
        {viewMode === 'test' && <Test />}
        {viewMode === 'visualizer' && <Visualizer />}
      </MainContent>
      {deleteDialog}
    </>
  );
}

export default Studio;
