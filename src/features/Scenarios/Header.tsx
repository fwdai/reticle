import { useContext } from 'react';
import { ArrowLeft, Pencil, FlaskConical, Network, Play, Loader2, MoreVertical, Download } from "lucide-react";

import { StudioContext } from '@/contexts/StudioContext';
import Header from "@/components/Layout/Header";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function StudioHeader() {
  const context = useContext(StudioContext);

  if (!context) {
    console.error('StudioContext not found in StudioHeader');
    return null;
  }

  const { studioState, viewMode, setViewMode, runScenario, backToList, setStudioState } = context;
  const { currentScenario, savedScenarios, isLoading, isSaved, isSaving } = studioState;

  const savedScenario = savedScenarios.find((s) => s.id === currentScenario.id);
  const revertValue = savedScenario?.title;

  const saveStatus = isSaving ? "saving" : isSaved ? "saved" : "unsaved";

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
          revertValue={revertValue}
          placeholder="Name your scenario..."
          saveStatus={saveStatus}
        />
      </div>
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          disabled={isLoading}
          className="h-9 gap-2 bg-primary text-white hover:bg-primary/90 font-semibold px-5 disabled:opacity-40 disabled:shadow-none"
          onClick={runScenario}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
        </Button>
        <div className="h-6 w-px bg-border-light" />
        <SegmentedSwitch
          options={[
            { value: "editor", label: "Edit", icon: <Pencil className="h-3.5 w-3.5" /> },
            { value: "test", label: "Test", icon: <FlaskConical className="h-3.5 w-3.5" /> },
            { value: "visualizer", label: "Visualize", icon: <Network className="h-3.5 w-3.5" /> },
          ]}
          value={viewMode}
          onChange={(v) => setViewMode(v)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-text-muted hover:text-text-main hover:bg-gray-100/80 active:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 text-sm" onClick={() => { /* TODO: export scenario */ }}>
              <Download className="h-4 w-4" />
              Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Header>
  );
}

export default StudioHeader;