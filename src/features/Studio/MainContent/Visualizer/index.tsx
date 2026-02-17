import { useContext } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import { MetricsBar } from "./MetricsBar";
import { BottomBar } from "./BottomBar";
import { FlowCanvas } from "./FlowCanvas";

export default function Visualizer() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("Visualizer must be used within a StudioProvider");
  }

  const { studioState, runScenario, navigateToEditor } = context;
  const { currentScenario, response, providerModels, isLoading } = studioState;
  const { systemPrompt, userPrompt, attachments, tools, configuration, history } = currentScenario;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <MetricsBar />
      <FlowCanvas
        systemPrompt={systemPrompt}
        userPrompt={userPrompt}
        attachments={attachments}
        tools={tools}
        configuration={configuration}
        history={history}
        response={response}
        providerModels={providerModels}
        isLoading={isLoading}
        runScenario={runScenario}
        navigateToEditor={navigateToEditor}
      />
      <BottomBar />
    </div>
  );
}
