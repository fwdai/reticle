import { Search, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { panelBase, panelHeader, panelTitle, availableTools } from "./constants";

interface ToolsSelectorPanelProps {
  selectedTools: string[];
  search: string;
  onToolToggle: (id: string) => void;
  onSearchChange: (value: string) => void;
}

export function ToolsSelectorPanel({
  selectedTools,
  search,
  onToolToggle,
  onSearchChange,
}: ToolsSelectorPanelProps) {
  const filteredTools = availableTools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <div className="flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-text-muted" />
          <span className={panelTitle}>Allowed Tools</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
            {selectedTools.length}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tools..."
            className="h-9 pl-9 text-xs border-border-light bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[252px] overflow-y-auto custom-scrollbar">
          {filteredTools.map((tool) => {
            const isSelected = selectedTools.includes(tool.id);
            return (
              <button
                key={tool.id}
                onClick={() => onToolToggle(tool.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                  isSelected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border-light bg-white hover:border-slate-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 transition-colors",
                    isSelected ? "bg-primary/15 text-primary" : "bg-slate-100 text-text-muted"
                  )}
                >
                  <Wrench className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-semibold truncate",
                      isSelected ? "text-text-main" : "text-text-main/80"
                    )}
                  >
                    {tool.name}
                  </p>
                  <p className="text-[10px] text-text-muted line-clamp-1">{tool.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
