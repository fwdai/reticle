import { Folder, List, Plus } from "lucide-react";
import { useContext, useState } from "react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { StudioContext } from "@/contexts/StudioContext";
import NewCollectionModal from "./components/NewCollectionModal";

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error("StudioContext not found in Studio sidebar");
    return null;
  }

  const { studioState, selectedCollectionId, setSelectedCollectionId, backToList, createCollection } = context;
  const { collections, savedScenarios } = studioState;

  const [isModalOpen, setIsModalOpen] = useState(false);

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
        {collections.map((collection) => (
          <SidebarItem
            key={collection.id}
            icon={Folder}
            label={collection.name}
            active={selectedCollectionId === collection.id}
            onClick={() => {
              setSelectedCollectionId(collection.id!);
              backToList();
            }}
            count={scenariosByCollection[collection.id!] ?? 0}
          />
        ))}
      </SidebarSection>
      <NewCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCollectionSubmit}
      />
    </Sidebar>
  );
}

export default Studio;