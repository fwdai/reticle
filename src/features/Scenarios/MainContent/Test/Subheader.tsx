import {
  Play,
  RotateCcw,
  FlaskConical,
  Code,
  AlignLeft,
  Columns2,
  GitCompare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";

interface SubheaderProps {
  innerMode: "edit" | "run" | "compare" | "compareRuns";
  viewMode: "table" | "json";
  casesCount: number;
  running: boolean;
  hasResults: boolean;
  onModeChange: (mode: "edit" | "run" | "compare" | "compareRuns") => void;
  onRunSuite: () => void;
  onSwitchToTable: () => void;
  onSwitchToJson: () => void;
}

export function Subheader({
  innerMode,
  viewMode,
  casesCount,
  running,
  hasResults,
  onModeChange,
  onRunSuite,
  onSwitchToTable,
  onSwitchToJson,
}: SubheaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border-light px-6 h-12 bg-slate-50">
      <SegmentedSwitch<"edit" | "run" | "compare" | "compareRuns">
        variant="secondary"
        options={[
          { value: "edit", label: "Edit", icon: <FlaskConical className="h-3 w-3" /> },
          { value: "run", label: "Run", icon: <Play className="h-3 w-3" />, disabled: casesCount === 0 },
          { value: "compare", label: "Compare Models", icon: <Columns2 className="h-3 w-3" /> },
          { value: "compareRuns", label: "Compare Runs", icon: <GitCompare className="h-3 w-3" /> },
        ]}
        value={innerMode}
        onChange={onModeChange}
      />

      <div className="flex items-center gap-3">
        {innerMode === "edit" && (
          <SegmentedSwitch<"table" | "json">
            variant="secondary"
            options={[
              { value: "table", label: "TABLE", icon: <AlignLeft className="h-3 w-3" /> },
              { value: "json", label: "JSON", icon: <Code className="h-3 w-3" /> },
            ]}
            value={viewMode}
            onChange={(v) => (v === "table" ? onSwitchToTable() : onSwitchToJson())}
          />
        )}

        {innerMode === "run" && !running && (
          <Button
            size="sm"
            disabled={casesCount === 0}
            className="h-9 gap-2 bg-primary text-white hover:bg-primary/90 font-semibold px-5 disabled:opacity-40 disabled:shadow-none"
            onClick={onRunSuite}
          >
            {hasResults ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {hasResults ? "Re-run" : "Run Suite"}
          </Button>
        )}
      </div>
    </div>
  );
}
