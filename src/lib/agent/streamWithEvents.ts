import type { Agent, ToolSet } from 'ai';
import type {
  AgentEventCallback,
  FinalResponseEvent,
  LLMRequestEvent,
  LLMResponseEvent,
  LoopEndEvent,
  LoopStartEvent,
  StreamChunk,
  TaskReceivedEvent,
  ToolCallEvent,
  ToolResultEvent,
} from './types';

export interface StreamWithEventsOptions {
  /** User prompt (for task_received event). Use prompt or messages. */
  prompt?: string;
  /** Message array (alternative to prompt). Use prompt or messages. */
  messages?: Array<{ role: string; content: unknown }>;
  /** Model ID for display (e.g. gpt-4.1) */
  modelId: string;
  /** Callback invoked for each event */
  onEvent: AgentEventCallback;
  /** Abort signal */
  abortSignal?: AbortSignal;
}

/**
 * Streams agent execution and emits structured events to the callback.
 * Events follow the breakdown:
 * 1. task_received
 * 2..n. loop_start → llm_request → [tool_call, tool_result]* → llm_response → loop_end
 * n. final_response
 */
export async function streamWithEvents(
  agent: { stream: (opts: unknown) => ReturnType<Agent<never, ToolSet>['stream']> },
  options: StreamWithEventsOptions
) {
  const { prompt, messages, modelId, onEvent, abortSignal } = options;

  const taskPrompt =
    typeof prompt === 'string'
      ? prompt
      : Array.isArray(messages)
        ? JSON.stringify(messages.map((m) => ({ role: m.role, content: m.content })))
        : '';

  await onEvent({
    type: 'task_received',
    prompt: taskPrompt,
  } satisfies TaskReceivedEvent);

  let loopIndex = 0;
  let stepText = '';
  let stepToolCalls: Array<{ toolName: string; input: unknown }> = [];

  const stream = await agent.stream({
    ...(prompt !== undefined ? { prompt } : { messages: messages ?? [] }),
    abortSignal,
    experimental_transform: () =>
      new TransformStream<StreamChunk, StreamChunk>({
        async transform(chunk, controller) {
          // console.log('chunk ======> ', chunk);
          switch (chunk.type) {
            case 'start-step': {
              loopIndex += 1;
              stepText = '';
              stepToolCalls = [];

              await onEvent({
                type: 'loop_start',
                loopIndex,
              } satisfies LoopStartEvent);

              await onEvent({
                type: 'llm_request',
                modelId,
                details: chunk.request ?? {},
              } satisfies LLMRequestEvent);
              break;
            }

            case 'tool-call': {
              const toolName = chunk.toolName ?? 'unknown';
              stepToolCalls.push({
                toolName,
                input: chunk.input,
              });

              await onEvent({
                type: 'tool_call',
                toolName,
                details: { input: chunk.input },
              } satisfies ToolCallEvent);
              break;
            }

            case 'tool-result': {
              await onEvent({
                type: 'tool_result',
                toolName: chunk.toolName ?? 'unknown',
                details: { output: chunk.output },
              } satisfies ToolResultEvent);
              break;
            }

            case 'text-delta': {
              stepText += chunk.text ?? '';
              break;
            }

            case 'finish-step': {
              await onEvent({
                type: 'llm_response',
                modelId: chunk.response?.modelId ?? modelId,
                details: {
                  text: stepText || undefined,
                  toolCalls:
                    stepToolCalls.length > 0 ? stepToolCalls : undefined,
                  usage: chunk.usage,
                  finishReason: chunk.finishReason,
                },
              } satisfies LLMResponseEvent);

              await onEvent({
                type: 'loop_end',
                loopIndex,
              } satisfies LoopEndEvent);
              break;
            }

            default:
              break;
          }
          controller.enqueue(chunk);
        },
      }),
    onFinish: async ({ text }: { text: string }) => {
      await onEvent({
        type: 'final_response',
        details: { text: text ?? '' },
      } satisfies FinalResponseEvent);
    },
  } as unknown as Parameters<Agent<never, ToolSet>['stream']>[0]);

  return stream;
}
