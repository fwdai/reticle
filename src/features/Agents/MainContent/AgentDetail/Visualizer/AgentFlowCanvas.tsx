import {
  Cpu,
  Wrench,
  Brain,
  ArrowRight,
  Target,
  RotateCcw,
  MessageSquare,
  GitBranch,
  Eye,
  Settings2,
} from "lucide-react";
import { FlowNode, FlowConnector, MiniTag, ConfigChip } from "@/components/Visualizer";
import { cn } from "@/lib/utils";
import { useAgentContext } from "@/contexts/AgentContext";

export interface AgentFlowCanvasProps {
  provider: string;
  model: string;
  agentGoal: string;
  systemInstructions: string;
  maxIterations: number;
  memoryEnabled: boolean;
  memorySource: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export function AgentFlowCanvas({
  provider,
  model,
  agentGoal,
  systemInstructions,
  maxIterations,
  memoryEnabled,
  memorySource,
  temperature,
  topP,
  maxTokens,
}: AgentFlowCanvasProps) {
  const { execution } = useAgentContext();
  const hasExecution = execution && execution.steps.length > 0;
  const isRunning = execution?.status === "running";
  const isSuccess = execution?.status === "success";
  const isError = execution?.status === "error";

  const taskInput = hasExecution
    ? execution.steps.find((s) => s.type === "task_input")?.content
    : agentGoal || "Task input will appear when you run a test";
  // Reasoning is embedded in model_call steps (not a separate step type). Extract from first model_call.
  const modelCallStep = hasExecution
    ? execution.steps.find((s) => s.type === "model_call")
    : null;
  const reasoningFromModel = (() => {
    if (!modelCallStep?.content) return null;
    try {
      const parsed = JSON.parse(modelCallStep.content) as { reasoning?: string };
      return parsed.reasoning ?? null;
    } catch {
      return null;
    }
  })();
  const toolCalls = hasExecution
    ? execution.steps.filter((s) => s.type === "tool_call" || s.type === "tool_response")
    : [];
  const memoryStep = hasExecution
    ? execution.steps.find((s) => s.type === "memory_read")
    : null;
  const outputStep = hasExecution
    ? execution.steps.find((s) => s.type === "output")
    : null;
  const loopCount = hasExecution
    ? Math.max(...execution.steps.map((s) => s.loop ?? 0), 0)
    : 0;

  /** Inferred decision when no explicit reasoning text: call tool, answer, or iterate */
  const reasoningDecision =
    hasExecution && !reasoningFromModel
      ? toolCalls.length > 0
        ? `Decided to call tool${toolCalls.length > 1 ? "s" : ""}`
        : outputStep
          ? "Decided to respond"
          : isRunning
            ? "Deciding: call tool, answer, or continue?"
            : loopCount > 1
              ? "Iterated to refine"
              : "Planning next step"
      : null;

  const status = isRunning ? "active" : isSuccess ? "success" : isError ? "error" : "idle";
  const connectorStatus = status === "error" ? "idle" : status;
  const totalTokens = execution?.tokens ?? 0;

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex min-h-full items-start justify-center">
        <div className="flex flex-col items-center gap-0">
          {/* Row 1: Task Input */}
          <FlowNode
            icon={Target}
            title="TASK INPUT"
            subtitle="Agent Trigger"
            status={hasExecution ? status : "idle"}
            className="w-[460px] shrink-0"
          >
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                &quot;{taskInput}&quot;
              </p>
              <MiniTag>{String(taskInput).length} chars</MiniTag>
            </div>
          </FlowNode>

          <FlowConnector
            direction="vertical"
            status={connectorStatus}
            animated={hasExecution}
            length="medium"
            label="init"
          />

          {/* Row 2: Reasoning + Model + Memory */}
          <div className="flex items-center gap-0">
            <FlowNode
              icon={Brain}
              title="REASONING"
              subtitle="Deciding: tool, answer, or continue?"
              status={hasExecution ? status : "idle"}
              className="w-64 shrink-0"
            >
              <div className="space-y-1.5">
                {reasoningFromModel ? (
                  <>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {reasoningFromModel}
                    </p>
                    <MiniTag>LLM reasoning</MiniTag>
                  </>
                ) : reasoningDecision ? (
                  <>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {reasoningDecision}
                    </p>
                    <MiniTag variant="muted">inferred from flow</MiniTag>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50 italic">
                    {systemInstructions ? "System instructions configured" : "No instructions"}
                  </p>
                )}
              </div>
            </FlowNode>

            <FlowConnector
              direction="horizontal"
              status={connectorStatus}
              animated={hasExecution}
              length="medium"
            />

            {/* Central Model Node */}
            <div className="relative">
              <div
                className={cn(
                  "relative rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-glow transition-all w-64 shrink-0 select-none"
                )}
              >
                <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/5 blur-xl" />
                <div className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-card bg-primary animate-pulse" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{model}</div>
                    <div className="text-[10px] text-muted-foreground">{model}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <ConfigChip label="Temp" value={String(temperature)} />
                  <ConfigChip label="Top P" value={String(topP)} />
                  <ConfigChip label="Max" value={String(maxTokens)} />
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Settings2 className="h-3 w-3" />
                  <span>{provider} · Max {maxIterations} loops</span>
                </div>
              </div>
            </div>

            <FlowConnector
              direction="horizontal"
              status={connectorStatus}
              animated={hasExecution}
              length="medium"
            />

            <FlowNode
              icon={Eye}
              title="MEMORY"
              subtitle="Context Recall"
              status={memoryStep ? status : memoryEnabled ? "idle" : "idle"}
              className="w-64 shrink-0"
            >
              <div className="space-y-1.5">
                {memoryStep ? (
                  <>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {memoryStep.content}
                    </p>
                    <div className="flex gap-2">
                      <MiniTag>Recall</MiniTag>
                      <MiniTag>{memorySource}</MiniTag>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50 italic">
                    {memoryEnabled ? `${memorySource} store` : "Disabled"}
                  </p>
                )}
              </div>
            </FlowNode>
          </div>

          <FlowConnector
            direction="vertical"
            status={connectorStatus}
            animated={hasExecution}
            length="medium"
            label={loopCount > 0 ? `loop ${loopCount}` : "process"}
          />

          {/* Row 3: Agent Loop — Tool Calls */}
          <div className="relative">
            {loopCount > 0 && (
              <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[9px] font-mono text-primary/60">×{loopCount}</span>
              </div>
            )}

            <div
              className={cn(
                "flex items-center gap-0 rounded-2xl p-4",
                hasExecution && "border border-dashed border-primary/15",
                hasExecution && "bg-primary/5"
              )}
            >
              {toolCalls.length > 0 ? (
                <>
                  {toolCalls.slice(0, 6).map((step, i) => (
                    <div key={step.id} className="flex items-center gap-0">
                      {i > 0 && (
                        <FlowConnector
                          direction="horizontal"
                          status={connectorStatus}
                          animated
                          length="short"
                        />
                      )}
                      <FlowNode
                        icon={step.type === "tool_call" ? Wrench : MessageSquare}
                        title={
                          step.type === "tool_call"
                            ? `TOOL: ${step.label}`
                            : "TOOL RESULT"
                        }
                        subtitle={step.type === "tool_call" ? "Function Call" : "Response"}
                        status={status}
                        className="w-[200px] shrink-0"
                      >
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-muted-foreground line-clamp-1 font-mono">
                            {step.content.slice(0, 60)}
                            {step.content.length > 60 ? "…" : ""}
                          </p>
                          {step.duration && <MiniTag>{step.duration}</MiniTag>}
                        </div>
                      </FlowNode>
                    </div>
                  ))}
                </>
              ) : (
                <FlowNode
                  icon={Wrench}
                  title="TOOLS"
                  subtitle="Function Calling"
                  status="idle"
                  className="w-[280px] shrink-0"
                >
                  <p className="text-[11px] text-muted-foreground/50 italic">
                    Tool calls appear when agent runs
                  </p>
                </FlowNode>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center relative">
            <FlowConnector
              direction="vertical"
              status={connectorStatus}
              animated={hasExecution}
              length="medium"
              label="resolve"
            />
            <div className="absolute right-[-120px] top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="h-px w-8 bg-border" />
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5">
                <GitBranch className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/50 font-medium">
                  alt: escalate to human
                </span>
              </div>
            </div>
          </div>

          {/* Row 4: Guardrails (TODO: add later) + Output */}
          <div className="flex items-center gap-0">
            {/* Guardrails node - uncomment when guardrails are implemented (add Shield to imports)
            <FlowNode
              icon={Shield}
              title="GUARDRAILS"
              subtitle="Safety Check"
              status={isSuccess ? status : "idle"}
              className="w-[180px] shrink-0"
            >
              <div className="flex items-center gap-2">
                <MiniTag variant={isSuccess ? "accent" : "default"}>
                  {isSuccess ? "PASSED" : "—"}
                </MiniTag>
              </div>
            </FlowNode>

            <FlowConnector
              direction="horizontal"
              status={connectorStatus}
              animated={hasExecution}
              length="medium"
            />
            */}

            <FlowNode
              icon={ArrowRight}
              title="FINAL OUTPUT"
              subtitle="Agent Response"
              status={outputStep ? status : "idle"}
              className="w-[380px] shrink-0"
            >
              <div className="space-y-3">
                {outputStep ? (
                  <>
                    <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-3">
                      &quot;{outputStep.content}&quot;
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {totalTokens > 0 && (
                        <MiniTag variant="accent">{totalTokens} tokens</MiniTag>
                      )}
                      {loopCount > 0 && <MiniTag>finish: {loopCount} loops</MiniTag>}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground/50 italic">
                    Run a test to see the agent output
                  </p>
                )}
              </div>
            </FlowNode>
          </div>
        </div>
      </div>
    </div>
  );
}
