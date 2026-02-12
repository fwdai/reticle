import { Folder, FileText, ChevronRight } from "lucide-react";
import { useContext, useState } from 'react';
import Sidebar from "@/components/Layout/Sidebar";
import { StudioContext } from '@/contexts/StudioContext';
import { Scenario } from '@/types';

function Studio() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in Studio sidebar');
    return null;
  }

  const { studioState, loadScenario } = context;
  const { collections, savedScenarios, currentScenario } = studioState;

  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());

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

  return (
    <Sidebar title="Scenarios">
      <div>
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Collections</h3>
        <nav className="space-y-1">
          {collections.map(collection => (
            <div key={collection.id}>
              <a
                className="flex items-center justify-between p-1 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer"
                onClick={() => toggleCollapse(collection.id!)}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={`text-sm text-gray-400 transition-transform ${collapsedCollections.has(collection.id!) ? '' : 'rotate-90'
                      }`}
                    size={16}
                  />
                  <Folder className="text-sm text-sidebar-text" size={16} />
                  <span className="text-sm text-sidebar-text">{collection.name}</span>
                </div>
              </a>
              {!collapsedCollections.has(collection.id!) && (
                <div className="ml-5 mt-1 space-y-0.5">
                  {(scenariosByCollection[collection.id!] || []).map(scenario => (
                    <a
                      key={scenario.id}
                      onClick={() => loadScenario(scenario.id!)}
                      className={`flex items-center justify-between px-3 py-1 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer ${currentScenario?.id === scenario.id ? 'bg-gray-200' : ''
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-sm text-sidebar-text" size={16} />
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
    </Sidebar>
  );
}

export default Studio;
