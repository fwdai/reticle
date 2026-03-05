import { ArrowLeft, Pencil, FlaskConical, Network, History, MoreVertical, Download } from "lucide-react";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { EditableTitle, type SaveStatus } from "@/components/ui/EditableTitle";
import LayoutHeader from "@/components/Layout/Header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type AgentViewMode = "editor" | "test" | "visualizer" | "runs";

interface HeaderProps {
  agentName: string;
  isNew: boolean;
  viewMode: AgentViewMode;
  saveStatus: SaveStatus;
  onBack: () => void;
  onAgentNameChange: (name: string) => void;
  onViewModeChange: (mode: AgentViewMode) => void;
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
      <div className="flex items-center gap-4">
        <SegmentedSwitch
          options={[
            { value: "editor", label: "Edit", icon: <Pencil className="h-3.5 w-3.5" /> },
            { value: "test", label: "Test", icon: <FlaskConical className="h-3.5 w-3.5" /> },
            { value: "visualizer", label: "Visualize", icon: <Network className="h-3.5 w-3.5" /> },
            { value: "runs", label: "Runs", icon: <History className="h-3.5 w-3.5" /> },
          ]}
          value={viewMode}
          onChange={(v) => onViewModeChange(v as AgentViewMode)}
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
            <DropdownMenuItem className="gap-2 text-sm" onClick={() => { /* TODO: export agent */ }}>
              <Download className="h-4 w-4" />
              Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </LayoutHeader>
  );
}
