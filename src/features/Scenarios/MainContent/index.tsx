import { useContext, useState, useMemo, useEffect } from 'react';
import MainContent from '@/components/Layout/MainContent';
import { StudioContext } from '@/contexts/StudioContext';

import Header from '../Header';
import ListHeader from '../ListHeader';
import Editor from './Editor';
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
    deleteScenario,
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
  }, [filteredScenarios]);

  const handleCreateScenario = () => {
    if (selectedCollectionId) {
      createScenario?.(selectedCollectionId);
    }
  };

  const handleDeleteClick = (scenario: Scenario) => setScenarioToDelete(scenario);
  const handleConfirmDelete = async () => {
    if (!scenarioToDelete) return;
    await deleteScenario?.(scenarioToDelete.id!);
    setScenarioToDelete(null);
  };

  const isListViewModel = scenarioId === null;

  if (isListViewModel) {
    return (
      <MainContent>
        <ListHeader
          title={selectedCollectionId ? (collectionNames[selectedCollectionId] ?? "Collection") : "All Scenarios"}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateScenario={handleCreateScenario}
          scenarioCount={filteredScenarios.length}
          canCreate={!!selectedCollectionId}
        />
        <ScenarioList
          scenarios={filteredScenarios}
          collectionNames={collectionNames}
          scenarioStats={scenarioStats}
          scenarioStatusMap={scenarioStatusMap}
          onSelectScenario={(id) => loadScenario?.(id)}
          onDeleteScenario={handleDeleteClick}
          hasCollectionSelected={selectedCollectionId !== null}
        />
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
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Header />
      {viewMode === 'editor' ? <Editor /> : <Visualizer />}
    </MainContent>
  );
}

export default Studio;
