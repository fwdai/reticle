export type ExecutionStatus = "idle" | "running" | "success" | "error";

export type StepStatus = "success" | "error" | "running" | "pending";

export type StepType =
  | "task_input"
  | "reasoning"
  | "model_call"
  | "model_response"
  | "tool_call"
  | "tool_response"
  | "memory_read"
  | "memory_write"
  | "decision"
  | "output"
  | "error";

export interface ExecutionStep {
  id: string;
  type: StepType;
  label: string;
  status: StepStatus;
  loop?: number;
  timestamp: string;
  duration?: string;
  tokens?: number;
  cost?: string;
  content: string;
  meta?: Record<string, string>;
  processingMs?: number;
}

export type StepPhase = "hidden" | "appearing" | "processing" | "done";
