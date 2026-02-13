import { Folder, FileText, ChevronRight, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useContext, useState } from 'react';
import Sidebar from "@/components/Layout/Sidebar";
import { StudioContext } from '@/contexts/StudioContext';
import { Scenario } from '@/types';
import NewCollectionModal from './components/NewCollectionModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in Studio sidebar');
    return null;
  }

  const { studioState, loadScenario, createCollection, createScenario, deleteScenario } = context;
  const { collections, savedScenarios, currentScenario } = studioState;

  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());
  const [hoveredCollectionId, setHoveredCollectionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);

  const toggleCollapse = (collectionId: string) => {
    setCollapsedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const scenariosByCollection = savedScenarios.reduce((acc, scenario) => {
    const collectionId = scenario.collection_id;
    if (!acc[collectionId]) {
      acc[collectionId] = [];
    }
    acc[collectionId].push(scenario);
    return acc;
  }, {} as Record<string, Scenario[]>);

  const handleCreateCollection = () => {
    setIsModalOpen(true);
  };

  const handleCreateCollectionSubmit = async (name: string) => {
    await createCollection(name);
    setIsModalOpen(false);
  };

  const handleCreateScenario = async (collectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await createScenario(collectionId);
  };

  const handleDeleteClick = (scenario: Scenario) => {
    setScenarioToDelete(scenario);
  };

  const handleConfirmDelete = async () => {
    if (!scenarioToDelete) return;
    await deleteScenario(scenarioToDelete.id!);
    setScenarioToDelete(null);
  };

  return (
    <Sidebar title="Scenarios">
      <div>
        <div className="flex items-center justify-between mb-2 pl-4 pr-3">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Collections</h3>
          <button onClick={handleCreateCollection} className="text-text-muted hover:text-text-main hover:bg-gray-200 cursor-pointer p-1 rounded-md">
            <Plus size={16} />
          </button>
        </div>
        <nav className="space-y-1">
          {collections.map(collection => (
            <div key={collection.id}>
              <div
                className="flex items-center justify-between text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer px-4 py-1 group"
                onMouseEnter={() => setHoveredCollectionId(collection.id!)}
                onMouseLeave={() => setHoveredCollectionId(null)}
              >
                <a
                  className="flex items-center gap-2 flex-grow py-1"
                  onClick={() => toggleCollapse(collection.id!)}
                >
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <Folder
                      className={`absolute text-sm text-sidebar-text transition-opacity duration-200 ${hoveredCollectionId === collection.id ? 'opacity-0' : 'opacity-100'
                        }`}
                      size={16}
                    />
                    <ChevronRight
                      className={`absolute text-sm text-gray-400 transition-[opacity,transform] duration-200 ease-in-out ${hoveredCollectionId === collection.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        } ${collapsedCollections.has(collection.id!) ? '' : 'rotate-90'}`}
                      size={16}
                    />
                  </div>
                  <span className="text-sm text-sidebar-text">{collection.name}</span>
                </a>
                {hoveredCollectionId === collection.id && (
                  <button
                    onClick={(event) => handleCreateScenario(collection.id!, event)}
                    className="ml-auto text-text-muted hover:text-text-main hover:bg-gray-300 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="New Scenario"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
              {!collapsedCollections.has(collection.id!) && (
                <div className="space-y-1">
                  {(scenariosByCollection[collection.id!] || []).map(scenario => (
                    <a
                      key={scenario.id}
                      onClick={() => loadScenario(scenario.id!)}
                      className={`group flex items-center justify-between pl-6 pr-4 py-1 text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer ${currentScenario?.id === scenario.id ? 'bg-gray-200' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="text-sm text-sidebar-text flex-shrink-0" size={16} strokeWidth={1.5} />
                        <span className="text-sm text-sidebar-text truncate">{scenario.title}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0 p-0.5 rounded text-text-muted hover:text-text-main hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Actions"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteClick(scenario)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      <NewCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCollectionSubmit}
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
    </Sidebar>
  );
}

export default Studio;