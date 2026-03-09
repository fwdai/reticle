import { Folder, List, MoreVertical, Plus, Trash2 } from "lucide-react";
import { useContext, useState } from "react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { StudioContext } from "@/contexts/StudioContext";
import NewCollectionModal from "./components/NewCollectionModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/types";

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error("StudioContext not found in Studio sidebar");
    return null;
  }

  const { studioState, selectedCollectionId, setSelectedCollectionId, backToList, createCollection, deleteCollection } = context;
  const { collections, savedScenarios } = studioState;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

  const scenariosByCollection = savedScenarios.reduce((acc, scenario) => {
    const cid = scenario.collection_id;
    if (!acc[cid]) acc[cid] = 0;
    acc[cid]++;
    return acc;
  }, {} as Record<string, number>);

  const handleCreateCollection = () => setIsModalOpen(true);
  const handleCreateCollectionSubmit = async (name: string) => {
    await createCollection(name);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;
    await deleteCollection(collectionToDelete.id!);
    setCollectionToDelete(null);
  };

  return (
    <Sidebar title="Scenarios">
      <SidebarSection
        title="Collections"
        headerAction={
          <button
            onClick={handleCreateCollection}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-main hover:bg-gray-200 cursor-pointer p-0.5 rounded-md"
            type="button"
          >
            <Plus size={16} />
          </button>
        }
      >
        <SidebarItem
          icon={List}
          label="All Scenarios"
          active={selectedCollectionId === null}
          onClick={() => {
            setSelectedCollectionId(null);
            backToList();
          }}
          count={savedScenarios.length}
        />
        {collections.map((collection) => {
          const count = scenariosByCollection[collection.id!] ?? 0;
          return (
            <SidebarItem
              key={collection.id}
              icon={Folder}
              label={collection.name}
              active={selectedCollectionId === collection.id}
              onClick={() => {
                setSelectedCollectionId(collection.id!);
                backToList();
              }}
              actions={
                <div className="relative flex items-center justify-end w-8">
                  <span className="text-[11px] text-text-muted tabular-nums group-hover:invisible">
                    {count}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild className="translate-x-1">
                        <button
                          className="p-0.5 rounded hover:bg-gray-300 text-text-muted hover:text-text-main"
                          onClick={(e) => e.stopPropagation()}
                          type="button"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="gap-2 text-xs text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollectionToDelete(collection);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              }
            />
          );
        })}
        <SidebarItem
          icon={Plus}
          label="Add collection"
          muted
          onClick={handleCreateCollection}
        />
      </SidebarSection >
      <NewCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCollectionSubmit}
      />
      <Dialog open={!!collectionToDelete} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete collection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{collectionToDelete?.name}&quot;? All scenarios inside will be permanently deleted too.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectionToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar >
  );
}

export default Studio;
