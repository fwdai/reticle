import { useMemo } from "react";
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

  const nodeStats = useMemo(() => {
    const hasSystemPrompt = systemPrompt.trim().length > 0;
    const hasUserPrompt = userPrompt.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    const hasTools = tools.length > 0;
    const hasHistory = history.length > 0;

    const systemPromptStatus = hasSystemPrompt ? "success" : "idle";
    const userPromptStatus = hasUserPrompt ? "success" : "error";
    const historyStatus = hasHistory ? "success" : "idle";
    const filesStatus = hasAttachments ? "success" : "idle";
    const toolsStatus = hasTools ? "success" : "idle";
    const responseStatus = response ? (response.error ? "error" : "success") : "idle";

    const statuses = [systemPromptStatus, userPromptStatus, historyStatus, filesStatus, toolsStatus, responseStatus];
    const active = statuses.filter((s) => s === "success").length + 1; // +1 for Model node
    const idle = statuses.filter((s) => s === "idle").length;
    const error = statuses.filter((s) => s === "error").length;

    return { total: 7, active, idle, error };
  }, [systemPrompt, userPrompt, attachments, tools, history, response]);

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
      <BottomBar {...nodeStats} />
    </div>
  );
}
