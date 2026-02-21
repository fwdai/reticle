import { useState } from "react";
import { Zap, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentContext } from "@/contexts/AgentContext";

export function Prompt() {
  const [taskInput, setTaskInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const { runAgent, isRunning } = useAgentContext();

  const handleRun = () => {
    runAgent(taskInput.trim());
  };

  return (
    <div className="flex-shrink-0 px-4 py-3 border-b border-border-light">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-2 transition-all duration-300",
          inputFocused
            ? "border-primary/50 bg-primary/5 shadow-sm"
            : "border-border-light bg-white hover:border-gray-300 hover:bg-gray-50/80"
        )}
      >
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0 transition-all duration-300",
            inputFocused ? "bg-primary/15 text-primary" : "bg-gray-100 text-text-muted/60"
          )}
        >
          <Zap className="h-3.5 w-3.5" />
        </div>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleRun();
            }
          }}
          placeholder="Describe a task for this agent…"
          rows={1}
          className="flex-1 resize-none border-none bg-transparent text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none py-0.5 leading-relaxed min-h-[24px] max-h-[72px] overflow-y-auto custom-scrollbar"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {taskInput.trim() && !isRunning && (
            <span className="text-[10px] text-text-muted/40 font-mono hidden sm:block">
              ⏎
            </span>
          )}
          <button
            disabled={!taskInput.trim() || isRunning}
            onClick={handleRun}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300",
              taskInput.trim() && !isRunning
                ? "bg-primary text-white hover:bg-primary/90 cursor-pointer"
                : "bg-gray-100 text-text-muted/40 cursor-not-allowed"
            )}
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
