import { ArrowLeft, Play, GitBranch, CheckCircle, XCircle } from "lucide-react";
import LayoutHeader from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import type { RunDetailRun } from "./types";

export type RunViewMode = "timeline" | "visualizer";

interface HeaderProps {
  run: RunDetailRun;
  viewMode: RunViewMode;
  onViewModeChange: (mode: RunViewMode) => void;
  onBack: () => void;
}

export function Header({ run, viewMode, onViewModeChange, onBack }: HeaderProps) {
  return (
    <LayoutHeader>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Runs
        </button>
        <div className="h-5 w-px bg-border-light" />
        <div className="flex items-center gap-3 leading-none">
          {run.status === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <div>
            <h2 className="text-sm font-bold text-text-main">{run.scenarioName}</h2>
            <span className="font-mono text-[11px] text-text-muted">{run.id}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <SegmentedSwitch<RunViewMode>
          options={[
            { value: "timeline", label: "Timeline" },
            { value: "visualizer", label: "Visualizer" },
          ]}
          value={viewMode}
          onChange={onViewModeChange}
        />
        <div className="h-6 w-px bg-border-light" />
        <Button variant="outline" size="sm" className="gap-2">
          <Play className="h-3.5 w-3.5" />
          Re-run
        </Button>
        <Button size="sm" className="gap-2">
          <GitBranch className="h-3.5 w-3.5" />
          Fork
        </Button>
      </div>
    </LayoutHeader>
  );
}
