import { useContext, useCallback } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import type { Tool } from "@/components/Tools/types";
import { ToolsContainer } from "@/components/Tools/ToolsContainer";

export default function Tools() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("Tools must be used within a StudioProvider");

  const { studioState, setStudioState } = context;

  const handleLocalToolsChange = useCallback((tools: Tool[]) => {
    setStudioState(prev => ({
      ...prev,
      currentScenario: { ...prev.currentScenario, tools },
    }));
  }, [setStudioState]);

  return (
    <ToolsContainer
      entityId={studioState.scenarioId ?? null}
      entityType="scenario"
      onLocalToolsChange={handleLocalToolsChange}
    />
  );
}
