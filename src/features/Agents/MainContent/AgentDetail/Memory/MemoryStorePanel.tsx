import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { listAgentMemories, deleteAgentMemory, clearAgentMemories } from "@/lib/storage";
import type { AgentMemory } from "@/lib/storage";
import { useAgentContext } from "@/contexts/AgentContext";
import { panelBase, panelHeader, panelTitle } from "../Spec/constants";

interface MemoryStorePanelProps {
  agentId: string;
}

export function MemoryStorePanel({ agentId }: MemoryStorePanelProps) {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const { execution } = useAgentContext();

  const load = () => listAgentMemories(agentId).then(setMemories);

  useEffect(() => { load(); }, [agentId]);

  // Refresh after a run completes so newly written memories appear
  useEffect(() => {
    if (execution.status === "success" || execution.status === "error") {
      load();
    }
  }, [execution.status]);

  async function handleDelete(id: string) {
    await deleteAgentMemory(id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }

  async function handleClearAll() {
    await clearAgentMemories(agentId);
    setMemories([]);
  }

  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <span className={panelTitle}>Stored Memories</span>
        {memories.length > 0 && (
          <button
            className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
            onClick={handleClearAll}
          >
            Clear All
          </button>
        )}
      </div>
      {memories.length === 0 ? (
        <div className="px-5 py-5">
          <p className="text-[11px] text-text-muted/60 italic">
            No memories stored yet. The agent will populate this during runs.
          </p>
        </div>
      ) : (
        <div>
          {memories.map(m => (
            <div
              key={m.id}
              className="flex items-start gap-3 px-5 py-2.5 border-b border-border-light hover:bg-slate-50 group last:border-b-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-text-main font-mono truncate">{m.key}</p>
                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2 break-words">{m.value}</p>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all shrink-0 mt-0.5"
                onClick={() => handleDelete(m.id)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
