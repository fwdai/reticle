import { FlowCanvas, type FlowCanvasProps } from "@/features/Studio/MainContent/Visualizer/FlowCanvas";
import type { TraceStep } from "./Timeline";
import type { RunDetailRun } from "./types";

function inferProviderFromModel(model: string): string {
  if (model.startsWith("gpt-") || model.startsWith("o1-") || model.startsWith("o3-")) return "openai";
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-")) return "google";
  return "openai";
}

function traceStepsToFlowCanvasProps(traceSteps: TraceStep[], run: RunDetailRun): FlowCanvasProps {
  const promptStep = traceSteps.find((s) => s.type === "prompt_assembly");
  const promptContent = promptStep?.content as Record<string, unknown> | undefined;
  const modelResponses = traceSteps.filter((s) => s.type === "model_response");
  const lastModelResponse = modelResponses[modelResponses.length - 1];
  const lastContent = lastModelResponse?.content as Record<string, unknown> | undefined;
  const toolCallCount = traceSteps.filter((s) => s.type === "tool_call").length;

  const system = typeof promptContent?.system === "string" ? promptContent.system : "";
  const messages = Array.isArray(promptContent?.messages) ? promptContent.messages as { role?: string; content?: string }[] : [];
  const firstUser = messages.find((m) => m.role === "user");
  const userPrompt = typeof firstUser?.content === "string" ? firstUser.content : "";

  const firstUserIdx = firstUser ? messages.indexOf(firstUser) : -1;
  const history = (firstUserIdx >= 0 ? messages.slice(firstUserIdx + 1) : [])
    .filter((m): m is { role: "user" | "assistant"; content: string } =>
      (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
    ) as { role: "user" | "assistant"; content: string }[];

  const model = typeof promptContent?.model === "string" ? promptContent.model : run.model;
  const provider = inferProviderFromModel(model);

  const chunks = Array.isArray(lastContent?.chunks) ? lastContent.chunks as string[] : [];
  const usage = lastContent?.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  const response = lastModelResponse
    ? {
        text: chunks.join(""),
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        error: run.status === "error" ? "Run failed" : undefined,
      }
    : null;

  const temp = typeof promptContent?.temperature === "number" ? promptContent.temperature : 0.7;
  const maxTokens = typeof promptContent?.max_tokens === "number" ? promptContent.max_tokens : 2048;

  const tools = Array.from({ length: toolCallCount }, (_, i) => ({
    id: String(i),
    name: `tool_${i}`,
    description: "",
    parameters: [],
    mockResponse: "",
  }));

  return {
    systemPrompt: system,
    userPrompt,
    attachments: [],
    tools,
    configuration: {
      provider,
      model,
      temperature: temp,
      topP: 1,
      maxTokens,
    },
    history,
    response,
    providerModels: {},
  };
}

interface VisualizerProps {
  traceSteps: TraceStep[];
  run: RunDetailRun;
}

export function Visualizer({ traceSteps, run }: VisualizerProps) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <FlowCanvas {...traceStepsToFlowCanvasProps(traceSteps, run)} />
    </div>
  );
}
