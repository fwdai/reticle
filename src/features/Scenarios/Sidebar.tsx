import { Folder, FileText, ChevronRight, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useContext, useState } from "react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudioContext } from "@/contexts/StudioContext";
import type { Scenario } from "@/types";
import NewCollectionModal from "./components/NewCollectionModal";

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error("StudioContext not found in Studio sidebar");
    return null;
  }

  const { studioState, loadScenario, createCollection, createScenario, deleteScenario } = context;
  const { collections, savedScenarios, currentScenario } = studioState;

  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());
  const [hoveredCollectionId, setHoveredCollectionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<Scenario | null>(null);

  const toggleCollapse = (collectionId: string) => {
    setCollapsedCollections((prev) => {
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
      <SidebarSection
        title="Collections"
        headerAction={
          <button
            onClick={handleCreateCollection}
            className="text-text-muted hover:text-text-main hover:bg-gray-200 cursor-pointer p-0.5 rounded-md"
            type="button"
          >
            <Plus size={16} />
          </button>
        }
      >
        {collections.map((collection) => (
          <div key={collection.id}>
            <div
              className="flex items-center justify-between text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer pl-4 pr-3 group"
              onMouseEnter={() => setHoveredCollectionId(collection.id!)}
              onMouseLeave={() => setHoveredCollectionId(null)}
            >
              <button
                type="button"
                className="flex items-center gap-2 flex-grow py-1 text-left"
                onClick={() => toggleCollapse(collection.id!)}
              >
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <Folder
                    className={`absolute text-sm text-sidebar-text transition-opacity duration-200 ${hoveredCollectionId === collection.id ? "opacity-0" : "opacity-100"
                      }`}
                    size={16}
                  />
                  <ChevronRight
                    className={`absolute text-sm text-gray-400 transition-[opacity,transform] duration-200 ease-in-out ${hoveredCollectionId === collection.id ? "opacity-100" : "opacity-0 pointer-events-none"
                      } ${collapsedCollections.has(collection.id!) ? "" : "rotate-90"}`}
                    size={16}
                  />
                </div>
                <span className="text-sm text-sidebar-text">{collection.name}</span>
              </button>
              {hoveredCollectionId === collection.id && (
                <button
                  type="button"
                  onClick={(event) => handleCreateScenario(collection.id!, event)}
                  className="ml-auto text-text-muted hover:text-text-main hover:bg-gray-300 p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  title="New Scenario"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            {!collapsedCollections.has(collection.id!) && (
              <div className="space-y-1">
                {(scenariosByCollection[collection.id!] || []).map((scenario) => (
                  <SidebarItem
                    key={scenario.id}
                    icon={FileText}
                    label={scenario.title}
                    active={currentScenario?.id === scenario.id}
                    onClick={() => loadScenario(scenario.id!)}
                    indent
                    actions={
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
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                          className="min-w-48 rounded-lg border border-border-light bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1"
                        >
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteClick(scenario)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </SidebarSection>
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