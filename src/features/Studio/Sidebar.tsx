import { Folder, FileText, ChevronRight, Plus } from "lucide-react";
import { useContext, useState } from 'react';
import Sidebar from "@/components/Layout/Sidebar";
import { StudioContext } from '@/contexts/StudioContext';
import { Scenario } from '@/types';
import NewCollectionModal from './components/NewCollectionModal';

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in Studio sidebar');
    return null;
  }

  const { studioState, loadScenario, createCollection } = context;
  const { collections, savedScenarios, currentScenario } = studioState;

  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());
  const [hoveredCollectionId, setHoveredCollectionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

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
    // Optionally, if the new collection should be immediately expanded or selected, handle it here
    setIsModalOpen(false); // Close modal after creation
  };

  return (
    <Sidebar title="Scenarios">
      <div>
        <div className="flex items-center justify-between mb-2 px-4">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Collections</h3>
          <button onClick={handleCreateCollection} className="text-text-muted hover:text-text-main">
            <Plus size={16} />
          </button>
        </div>
        <nav className="space-y-1">
          {collections.map(collection => (
            <div key={collection.id}>
              <a
                className="flex items-center justify-between text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer px-4 py-1"
                onClick={() => toggleCollapse(collection.id!)}
                onMouseEnter={() => setHoveredCollectionId(collection.id!)}
                onMouseLeave={() => setHoveredCollectionId(null)}
              >
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center"> {/* w-4 h-4 to match icon size */}
                    <Folder
                      className={`absolute text-sm text-sidebar-text transition-opacity duration-200 ${hoveredCollectionId === collection.id ? 'opacity-0' : 'opacity-100'
                        }`}
                      size={16}
                    />
                    <ChevronRight
                      className={`absolute text-sm text-gray-400 transition-opacity duration-200 transition-transform ${hoveredCollectionId === collection.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        } ${collapsedCollections.has(collection.id!) ? '' : 'rotate-90'}`}
                      size={16}
                    />
                  </div>
                  <span className="text-sm text-sidebar-text">{collection.name}</span>
                </div>
              </a>
              {!collapsedCollections.has(collection.id!) && (
                <div className="space-y-1">
                  {(scenariosByCollection[collection.id!] || []).map(scenario => (
                    <a
                      key={scenario.id}
                      onClick={() => loadScenario(scenario.id!)}
                      className={`flex items-center justify-between pl-6 pr-4 py-1 text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer ${currentScenario?.id === scenario.id ? 'bg-gray-200' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-sm text-sidebar-text" size={16} strokeWidth={1.5} />
                        <span className="text-sm text-sidebar-text">{scenario.title}</span>
                      </div>
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
    </Sidebar>
  );
}

export default Studio;