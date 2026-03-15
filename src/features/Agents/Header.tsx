import { Plus, Upload } from "lucide-react";

import Header from "@/components/Layout/Header";
import { SearchField } from "@/components/ui/SearchField";
import { openFileWithDialog, parseAgentConfig, type AgentConfigExport } from "@/lib/evals";

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
        <button
          onClick={handleImport}
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors flex-shrink-0"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </button>
        {!isEmpty && (
          <button
            className="h-9 px-4 rounded-lg gap-2 inline-flex items-center justify-center text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex-shrink-0"
            onClick={onCreateAgent}
          >
            <Plus className="h-3.5 w-3.5" />
            New Agent
          </button>
        )}
      </div>
    </Header>
  );
}

export default AgentsHeader;
