import {
  MessageSquare,
  Settings2,
  Cpu,
  FileText,
  Wrench,
  ArrowRight,
  Clock,
  Hash,
  History,
  Paperclip,
  Play,
  Loader2,
} from "lucide-react";
import { FlowNode, FlowConnector } from "./FlowNode";
import { MiniTag } from "./MiniTag";
import { ConfigChip } from "./ConfigChip";
import { PROVIDERS_LIST } from "@/constants/providers";
import { cn } from "@/lib/utils";
import type { ConfigurationState, HistoryItem, AttachedFile, ResponseState } from "@/contexts/StudioContext";
import type { Tool } from "@/features/Studio/MainContent/Editor/Main/Tools/types";
import type { EditorTabIndex } from "@/contexts/StudioContext";

/** Rough estimate: ~4 chars per token for English text */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function getProviderDisplayName(providerId: string): string {
  return PROVIDERS_LIST.find((p) => p.id === providerId)?.name ?? providerId;
}

function getModelDisplayName(providerModels: Record<string, unknown[]>, providerId: string, modelId: string): string {
  const models = (providerModels[providerId] ?? []) as { id?: string; name?: string }[];
  const model = models.find((m) => m.id === modelId);
  return model?.name ?? modelId;
}

export interface FlowCanvasProps {
  systemPrompt: string;
  userPrompt: string;
  attachments: AttachedFile[];
  tools: Tool[];
  configuration: ConfigurationState;
  history: HistoryItem[];
  response: ResponseState | null;
  providerModels: Record<string, unknown[]>;
  isLoading?: boolean;
  /** When provided, enables Run scenario button and navigation. Omit for read-only (e.g. Runs view). */
  runScenario?: () => Promise<void>;
  /** When provided, nodes are clickable and navigate to editor. Omit for read-only. */
  navigateToEditor?: (tab?: EditorTabIndex) => void;
}

export function FlowCanvas({
  systemPrompt,
  userPrompt,
  attachments,
  tools,
  configuration,
  history,
  response,
  providerModels,
  isLoading = false,
  runScenario,
  navigateToEditor,
}: FlowCanvasProps) {
  const hasSystemPrompt = systemPrompt.trim().length > 0;
  const hasUserPrompt = userPrompt.trim().length > 0;
  const hasAttachments = attachments.length > 0;
  const hasTools = tools.length > 0;
  const hasHistory = history.length > 0;

  const historyTotalTokens = history.reduce((sum, item) => sum + estimateTokens(item.content), 0);

  const providerName = getProviderDisplayName(configuration.provider);
  const modelDisplayName = getModelDisplayName(providerModels, configuration.provider, configuration.model);

  const systemPromptStatus = hasSystemPrompt ? "success" : "idle";
  const userPromptStatus = hasUserPrompt ? "success" : "error";
  const historyStatus = hasHistory ? "success" : "idle";
  const filesStatus = hasAttachments ? "success" : "idle";
  const toolsStatus = hasTools ? "success" : "idle";
  const responseStatus = response ? (response.error ? "error" : "success") : "idle";

  const inputMergeStatus = hasSystemPrompt || hasUserPrompt || hasHistory || hasAttachments ? "success" : "idle";

  const onNodeClick = (tab: EditorTabIndex) => navigateToEditor?.(tab);
  const onModelNodeClick = () => onNodeClick(0);

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex min-h-full items-start justify-center">
        <div className="flex flex-col items-center gap-0">
          {/* Row 1: System Prompt (left) → User Input (center) ← History/Files (right, stacked) */}
          <div className="flex items-center gap-0">
            <FlowNode
              icon={MessageSquare}
              title="SYSTEM PROMPT"
              subtitle="Instructions"
              status={systemPromptStatus}
              onClick={navigateToEditor ? () => onNodeClick(0) : undefined}
            >
              <div className="space-y-1.5">
                {hasSystemPrompt ? (
                  <>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      &quot;{systemPrompt}&quot;
                    </p>
                    <div className="flex items-center gap-2">
                      <MiniTag>{systemPrompt.length} chars</MiniTag>
                      <MiniTag>~{estimateTokens(systemPrompt)} tokens</MiniTag>
                    </div>
                  </>
                ) : (
                  <div className="text-[11px] text-muted-foreground/50 italic">
                    No system prompt
                  </div>
                )}
              </div>
            </FlowNode>

            <FlowConnector
              direction="horizontal"
              status={systemPromptStatus}
              animated={hasSystemPrompt}
              length="medium"
            />

            <div className="flex flex-col items-center gap-0">
              <FlowNode
                icon={FileText}
                title="USER INPUT"
                subtitle="Query"
                status={userPromptStatus}
                onClick={navigateToEditor ? () => onNodeClick(1) : undefined}
              >
                <div className="space-y-1.5">
                  {hasUserPrompt ? (
                    <>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                        &quot;{userPrompt}&quot;
                      </p>
                      <div className="flex items-center gap-2">
                        <MiniTag>{userPrompt.length} chars</MiniTag>
                        <MiniTag>~{estimateTokens(userPrompt)} tokens</MiniTag>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-destructive italic">
                      User prompt is required to run
                    </div>
                  )}
                </div>
              </FlowNode>

              <FlowConnector
                direction="vertical"
                status={inputMergeStatus}
                animated={inputMergeStatus === "success"}
                length="long"
                label="merge"
              />
            </div>

            <div className="flex flex-col items-stretch gap-4">
              <div className="flex items-end gap-0">
                <FlowConnector
                  direction="horizontal"
                  status={historyStatus}
                  length="medium"
                  reversed
                  animated={historyStatus === "success"}
                />
                <FlowNode
                  icon={History}
                  title="HISTORY"
                  subtitle="Conversation"
                  status={historyStatus}
                  className="w-[160px]"
                  onClick={navigateToEditor ? () => onNodeClick(2) : undefined}
                >
                  <div className="space-y-1.5">
                    {hasHistory ? (
                      <>
                        <p className="text-[11px] text-muted-foreground">
                          {history.length} message{history.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex items-center gap-2">
                          <MiniTag>~{historyTotalTokens} tokens</MiniTag>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-muted-foreground/50 italic">
                        No history
                      </div>
                    )}
                  </div>
                </FlowNode>
              </div>
              <div className="flex items-start gap-0">
                <FlowConnector
                  direction="horizontal"
                  status={filesStatus}
                  length="medium"
                  reversed
                  animated={filesStatus === "success"}
                />
                <FlowNode
                  icon={Paperclip}
                  title="FILES"
                  subtitle="Attachments"
                  status={filesStatus}
                  className="w-[160px]"
                  onClick={navigateToEditor ? () => onNodeClick(3) : undefined}
                >
                  <div className="text-[11px] text-muted-foreground">
                    {hasAttachments ? (
                      <span>{attachments.length} file{attachments.length !== 1 ? "s" : ""} attached</span>
                    ) : (
                      <span className="italic text-muted-foreground/50">No files</span>
                    )}
                  </div>
                </FlowNode>
              </div>
            </div>
          </div>

          {/* Row 2: Processing */}
          <div className="flex items-center gap-0">
            <FlowNode
              icon={Wrench}
              title="TOOLS"
              subtitle="Function Calling"
              status={toolsStatus}
              className="w-[180px]"
              onClick={navigateToEditor ? () => onNodeClick(4) : undefined}
            >
              <div className="text-[11px] text-muted-foreground">
                {hasTools ? (
                  <span>{tools.length} tool{tools.length !== 1 ? "s" : ""} configured</span>
                ) : (
                  <span className="italic text-muted-foreground/50">No tools configured</span>
                )}
              </div>
            </FlowNode>

            <FlowConnector
              direction="horizontal"
              status={toolsStatus}
              length="medium"
              animated={hasTools}
            />

            {/* Central Model Node - larger and emphasized */}
            <div className="relative">
              <div
                role={navigateToEditor ? "button" : undefined}
                tabIndex={navigateToEditor ? 0 : undefined}
                onClick={navigateToEditor ? onModelNodeClick : undefined}
                onKeyDown={navigateToEditor ? (e) => e.key === "Enter" && onModelNodeClick() : undefined}
                className={cn(
                  "relative rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-glow transition-all min-w-[260px] select-none",
                  navigateToEditor && "cursor-pointer hover:border-primary/50"
                )}
              >
                <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/5 blur-xl" />
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-card bg-primary animate-pulse" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{modelDisplayName}</div>
                    <div className="text-[10px] text-muted-foreground">{configuration.model}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <ConfigChip label="Temp" value={String(configuration.temperature)} />
                  <ConfigChip label="Top P" value={String(configuration.topP)} />
                  <ConfigChip label="Max" value={String(configuration.maxTokens)} />
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Settings2 className="h-3 w-3" />
                  <span>{providerName}</span>
                </div>
              </div>
            </div>

            <div className="w-[180px] flex-shrink-0" aria-hidden />
          </div>

          {/* Vertical Connector */}
          <div className="flex items-center justify-center">
            <FlowConnector
              direction="vertical"
              status={hasUserPrompt && responseStatus === "success" ? "success" : "idle"}
              animated={hasUserPrompt && responseStatus === "success"}
              length="medium"
              label="inference"
            />
          </div>

          {/* Row 3: Output */}
          <FlowNode
            icon={ArrowRight}
            title="RESPONSE"
            subtitle="Completion"
            status={responseStatus}
            className="w-[500px]"
            onClick={navigateToEditor ? onModelNodeClick : undefined}
          >
            {response ? (
              <div className="space-y-3">
                {response.error ? (
                  <p className="text-[11px] text-destructive leading-relaxed">
                    {response.error}
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-3">
                      &quot;{response.text}&quot;
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {response.usage?.totalTokens != null && (
                        <MiniTag variant="accent">{response.usage.totalTokens} tokens</MiniTag>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      {response.latency != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(response.latency / 1000).toFixed(2)}s total
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Prompt: {response.usage?.promptTokens ?? "—"} · Completion: {response.usage?.completionTokens ?? "—"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : runScenario ? (
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <p className="text-[11px] text-muted-foreground/50 italic text-center">
                  Run the scenario to see the response
                </p>
                <button
                  type="button"
                  onClick={runScenario}
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} />
                  )}
                  Run scenario
                </button>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-[11px] text-muted-foreground/50 italic text-center">
                  No response data
                </p>
              </div>
            )}
          </FlowNode>
        </div>
      </div>
    </div>
  );
}
