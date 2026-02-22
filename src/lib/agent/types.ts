import type { Agent, ToolSet } from 'ai';

export interface TaskReceivedEvent {
  type: 'task_received';
  /** User prompt or message summary */
  prompt: string;
}

export interface LoopStartEvent {
  type: 'loop_start';
  /** 1-based loop index */
  loopIndex: number;
}

export interface LLMRequestEvent {
  type: 'llm_request';
  /** Model identifier (e.g. gpt-4.1) */
  modelId: string;
  /** Params sent to LLM (request body, messages, etc.) */
  details: unknown;
}

export interface LLMResponseEvent {
  type: 'llm_response';
  /** Model identifier */
  modelId: string;
  /** Model output: text, tool calls, or both */
  details: {
    text?: string;
    toolCalls?: Array<{ toolName: string; input: unknown }>;
    usage?: unknown;
    finishReason?: string;
  };
}

export interface ToolCallEvent {
  type: 'tool_call';
  /** Tool name (e.g. get_data) */
  toolName: string;
  /** Function and params that are called */
  details: { input: unknown };
}

export interface ToolResultEvent {
  type: 'tool_result';
  /** Tool name */
  toolName: string;
  /** Tool returned data */
  details: { output: unknown };
}

export interface LoopEndEvent {
  type: 'loop_end';
  /** 1-based loop index */
  loopIndex: number;
}

export interface FinalResponseEvent {
  type: 'final_response';
  /** Answer from the agent */
  details: { text: string };
}

export type AgentEventCallback = (event: AgentEvent) => void | Promise<void>;

export type StreamChunk = {
  type: string;
  request?: unknown;
  toolName?: string;
  input?: unknown;
  output?: unknown;
  text?: string;
  response?: { modelId?: string };
  usage?: unknown;
  finishReason?: string;
};

export type AgentEvent =
  | TaskReceivedEvent
  | LoopStartEvent
  | LLMRequestEvent
  | LLMResponseEvent
  | ToolCallEvent
  | ToolResultEvent
  | LoopEndEvent
  | FinalResponseEvent;

export type { Agent, ToolSet };