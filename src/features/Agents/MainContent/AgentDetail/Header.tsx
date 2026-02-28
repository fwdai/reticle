import { ArrowLeft, Share } from "lucide-react";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { EditableTitle, type SaveStatus } from "@/components/ui/EditableTitle";
import LayoutHeader from "@/components/Layout/Header";

interface HeaderProps {
  agentName: string;
  isNew: boolean;
  viewMode: string;
  saveStatus: SaveStatus;
  onBack: () => void;
  onAgentNameChange: (name: string) => void;
  onViewModeChange: (mode: string) => void;
}

export function Header({
  agentName,
  isNew,
  viewMode,
  saveStatus,
  onBack,
  onAgentNameChange,
  onViewModeChange,
}: HeaderProps) {
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
        <EditableTitle
          value={agentName}
          onChange={onAgentNameChange}
          placeholder={isNew ? "Name your agent..." : "Agent name..."}
          saveStatus={saveStatus}
          autoFocus={isNew}
        />
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
        <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
          <Share size={18} />
        </button>
      </div>
    </LayoutHeader>
  );
}
