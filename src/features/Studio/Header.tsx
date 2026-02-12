import { useContext, useState, useEffect } from 'react';
import { Play, Save, Share, Loader2 } from "lucide-react";

import { StudioContext } from '@/contexts/StudioContext';
import Header from "@/components/Layout/Header";

function StudioHeader() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in StudioHeader');
    // Fallback or throw an error depending on desired behavior
    return null;
  }

  const { studioState, saveScenario, runScenario } = context;
  const { currentScenario, isLoading, isSaved } = studioState;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(currentScenario.name);

  // Update editingName when currentScenario changes (e.g., when a new scenario is loaded)
  useEffect(() => {
    setEditingName(currentScenario.name);
  }, [currentScenario.name]);

  const handleSaveClick = async () => {
    await saveScenario(null);
  };

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleNameBlur = async () => {
    if (editingName.trim() !== currentScenario.name) {
      // Pass the new name directly to saveScenario
      await saveScenario(editingName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger blur to save
    } else if (e.key === 'Escape') {
      setEditingName(currentScenario.name); // Revert to original name
      setIsEditingName(false);
    }
  };

  const statusBadge = isSaved ? (
    <span className="bg-green-50 text-[10px] text-green-600 font-bold px-2 py-0.5 rounded-full border border-green-100 ml-2 uppercase tracking-tight">Saved</span>
  ) : (
    <span className="bg-gray-100 text-[10px] text-gray-600 font-bold px-2 py-0.5 rounded-full border border-gray-100 ml-2 uppercase tracking-tight">Unsaved</span>
  );

  return (
    <Header>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-muted">{context.studioState.collections.find(collection => collection.id === currentScenario.collection_id)?.name}</span>
        <span className="text-gray-300">/</span>
        {isEditingName ? (
          <input
            type="text"
            value={editingName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="font-semibold text-text-main bg-transparent border-b border-blue-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="font-semibold text-text-main cursor-pointer hover:text-blue-500" onClick={handleNameClick}>
            {currentScenario.name}
          </span>
        )}
        {statusBadge}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white shadow-sm text-text-main">Editor</button>
          <button className="px-4 py-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors">Visualizer</button>
        </div>
        <div className="h-6 w-px bg-border-light"></div>
        <div className="flex items-center gap-2">
          <button
            onClick={runScenario}
            disabled={isLoading}
            className="bg-primary hover:bg-[#048fa9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
            {isLoading ? (
              <Loader2 size={18} className="font-bold animate-spin" />
            ) : (
              <Play size={18} className="font-bold" />
            )}
            Run
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isLoading || isSaved} // Cannot save if loading or already saved
            className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Save size={18} />
          </button>
          <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Share size={18} />
          </button>
        </div>
      </div>
    </Header>
  );
}

export default StudioHeader;