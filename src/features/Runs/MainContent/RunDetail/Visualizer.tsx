import { useEffect, useState } from "react";
import { FlowCanvas, type FlowCanvasProps } from "@/features/Scenarios/MainContent/Visualizer/FlowCanvas";
import { getExecutionById } from "@/lib/storage";
import type { Execution } from "@/types";
import type { RunDetailRun } from "./types";
import { executionToFlowCanvasProps } from "./executionToFlowCanvasProps";

export function Visualizer({ run }: { run: RunDetailRun }) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [flowCanvasProps, setFlowCanvasProps] = useState<FlowCanvasProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setFlowCanvasProps(null);
      try {
        const exec = await getExecutionById(run.id);
        if (cancelled) return;
        setExecution(exec ?? null);
        if (exec) {
          const props = await executionToFlowCanvasProps(exec, run);
          if (!cancelled) setFlowCanvasProps(props);
        }
      } catch {
        if (!cancelled) setExecution(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [run.id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted text-sm">
        Loading execution…
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted text-sm">
        Execution not found
      </div>
    );
  }

  if (!flowCanvasProps) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <FlowCanvas {...flowCanvasProps} />
    </div>
  );
}
