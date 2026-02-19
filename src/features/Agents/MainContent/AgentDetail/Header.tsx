import { useRef, useEffect, useState } from "react";
import { ArrowLeft, Share, Play } from "lucide-react";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import LayoutHeader from "@/components/Layout/Header";

type SaveStatus = "saved" | "saving" | "unsaved";

const PLACEHOLDER = "Name your agent...";
const MIN_WIDTH = 96;

interface HeaderProps {
  agentName: string;
  isNew: boolean;
  viewMode: string;
  saveStatus: SaveStatus;
  onBack: () => void;
  onAgentNameChange: (name: string) => void;
  onViewModeChange: (mode: string) => void;
  onRun: () => void;
}

export function Header({
  agentName,
  isNew,
  viewMode,
  saveStatus,
  onBack,
  onAgentNameChange,
  onViewModeChange,
  onRun,
}: HeaderProps) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(MIN_WIDTH);

  useEffect(() => {
    if (mirrorRef.current) {
      const w = mirrorRef.current.scrollWidth;
      setInputWidth(Math.max(MIN_WIDTH, w + 2));
    }
  }, [agentName, isNew]);

  const displayText = agentName || (isNew ? PLACEHOLDER : "");
  const statusBadge =
    saveStatus === "saved" ? (
      <span className="bg-green-50 text-[10px] text-green-600 font-bold px-2 py-0.5 rounded-full border border-green-100 ml-2 uppercase tracking-tight">
        Saved
      </span>
    ) : saveStatus === "saving" ? (
      <span className="bg-amber-50 text-[10px] text-amber-600 font-bold px-2 py-0.5 rounded-full border border-amber-100 ml-2 uppercase tracking-tight">
        Saving...
      </span>
    ) : (
      <span className="bg-gray-100 text-[10px] text-gray-600 font-bold px-2 py-0.5 rounded-full border border-gray-100 ml-2 uppercase tracking-tight">
        Unsaved
      </span>
    );

  return (
    <LayoutHeader>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Agents
        </button>
        <div className="h-5 w-px bg-border-light" />
        <div className="relative flex items-center text-sm shrink-0">
          <span
            ref={mirrorRef}
            className="pointer-events-none absolute left-0 top-0 whitespace-pre font-bold text-sm text-text-main opacity-0"
            aria-hidden
          >
            {displayText || "\u00A0"}
          </span>
          <input
            value={agentName}
            onChange={(e) => onAgentNameChange(e.target.value)}
            placeholder={isNew ? PLACEHOLDER : "Agent name..."}
            style={{ width: inputWidth }}
            className="font-bold bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/40 focus:ring-0 py-0"
            autoFocus={isNew}
          />
          {statusBadge}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SegmentedSwitch
          options={[
            { value: "editor", label: "Editor" },
            { value: "visualizer", label: "Visualizer" },
          ]}
          value={viewMode}
          onChange={onViewModeChange}
        />
        <div className="h-6 w-px bg-border-light" />
        <button
          onClick={onRun}
          className="h-9 px-5 rounded-xl gap-2 inline-flex items-center justify-center text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Play className="h-3.5 w-3.5" />
          Run Agent
        </button>
        <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
          <Share size={18} />
        </button>
      </div>
    </LayoutHeader>
  );
}
