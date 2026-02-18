import { ArrowLeft, Share, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import Header from "@/components/Layout/Header";

interface AgentDetailHeaderProps {
  agentName: string;
  isNew: boolean;
  viewMode: string;
  onBack: () => void;
  onAgentNameChange: (name: string) => void;
  onViewModeChange: (mode: string) => void;
  onRun: () => void;
  onSave: () => void;
}

export function AgentDetailHeader({
  agentName,
  isNew,
  viewMode,
  onBack,
  onAgentNameChange,
  onViewModeChange,
  onRun,
  onSave,
}: AgentDetailHeaderProps) {
  return (
    <Header>
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Agents
        </button>
        <div className="h-5 w-px bg-border-light" />
        <input
          value={agentName}
          onChange={(e) => onAgentNameChange(e.target.value)}
          placeholder={isNew ? "Name your agent..." : "Agent name..."}
          className="text-sm font-bold bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/40 min-w-[12rem] focus:ring-0"
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
        <div className="h-6 w-px bg-border-light" />
        <button
          onClick={onRun}
          className="h-9 px-5 rounded-xl gap-2 inline-flex items-center justify-center text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Play className="h-3.5 w-3.5" />
          Run Agent
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 font-medium text-xs border-border-light"
          onClick={onSave}
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
        <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
          <Share size={18} />
        </button>
      </div>
    </Header>
  );
}
