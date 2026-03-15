import { Plus, Upload, MoreVertical } from "lucide-react";

import Header from "@/components/Layout/Header";
import { SearchField } from "@/components/ui/SearchField";
import { openFileWithDialog, parseAgentConfig, type AgentConfigExport } from "@/lib/evals";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface AgentsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateAgent: () => void;
  onImportAgent: (config: AgentConfigExport) => void;
  agentCount: number;
  isEmpty?: boolean;
}

function AgentsHeader({
  search,
  onSearchChange,
  onCreateAgent,
  onImportAgent,
  agentCount,
  isEmpty,
}: AgentsHeaderProps) {
  const handleImport = async () => {
    const result = await openFileWithDialog([{ name: "JSON", extensions: ["json"] }]);
    if (!result) return;
    const config = parseAgentConfig(result.content);
    if (config) onImportAgent(config);
  };

  return (
    <Header>
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-text-main">Agents</h1>
        <span className="text-sm text-text-muted">
          {agentCount} agent{agentCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <SearchField
          value={search}
          onChange={onSearchChange}
          placeholder="Search agents..."
          disabled={isEmpty}
        />
        {isEmpty ? (
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors flex-shrink-0"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </button>
        ) : (
          <>
            <button
              className="h-9 px-4 rounded-lg gap-2 inline-flex items-center justify-center text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
              onClick={onCreateAgent}
            >
              <Plus className="h-3.5 w-3.5" />
              New Agent
            </button>
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
                <DropdownMenuItem className="gap-2 text-sm" onClick={handleImport}>
                  <Upload className="h-4 w-4" />
                  Import
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </Header>
  );
}

export default AgentsHeader;
