import { useContext } from 'react';
import { ArrowLeft, Play, Save, Share, Loader2 } from "lucide-react";

import { StudioContext } from '@/contexts/StudioContext';
import Header from "@/components/Layout/Header";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";

function StudioHeader() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in StudioHeader');
    return null;
  }

  const { studioState, viewMode, setViewMode, saveScenario, runScenario, backToList, setStudioState } = context;
  const { currentScenario, savedScenarios, isLoading, isSaved } = studioState;

  const handleSaveClick = async () => {
    await saveScenario(null);
  };

  const savedScenario = savedScenarios.find((s) => s.id === currentScenario.id);
  const revertValue = savedScenario?.title;

  return (
    <Header>
      <div className="flex items-center gap-4">
        <button
          onClick={backToList}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Scenarios
        </button>
        <div className="h-5 w-px bg-border-light" />
        <EditableTitle
          value={currentScenario.name}
          onChange={(name) =>
            setStudioState((prev) => ({
              ...prev,
              currentScenario: { ...prev.currentScenario, name },
            }))
          }
          onBlur={(name) => saveScenario(name)}
          revertValue={revertValue}
          placeholder="Name your scenario..."
          saveStatus={isSaved ? "saved" : "unsaved"}
        />
      </div>
      <div className="flex items-center gap-4">
        <SegmentedSwitch
          options={[
            { value: "editor", label: "Editor" },
            { value: "visualizer", label: "Visualizer" },
          ]}
          value={viewMode}
          onChange={(v) => setViewMode(v)}
        />
        <div className="h-6 w-px bg-border-light" />
        <div className="flex items-center gap-2">
          <button
            onClick={runScenario}
            disabled={isLoading}
            className="bg-primary hover:bg-[#048fa9] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            {isLoading ? (
              <Loader2 size={18} className="font-bold animate-spin" />
            ) : (
              <Play size={18} className="font-bold" />
            )}
            Run
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isLoading || isSaved}
            className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white"
          >
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