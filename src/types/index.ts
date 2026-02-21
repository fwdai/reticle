export type Page = "home" | "studio" | "agents" | "environments" | "runs" | "settings" | "templates";

export type SettingsSectionId =
  | "preferences"
  | "account"
  | "api-keys"
  | "integrations";

export type SidebarItem = Exclude<Page, "home">;

export type ExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type ExecutionType = 'scenario' | 'agent' | 'mcp';

export type LLMCallConfig = {
  provider: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export type Collection = {
  id?: string;
  name: string;
  description?: string;
  created_at?: number;
  updated_at?: number;
  archived_at?: number | null;
}

export type Scenario = {
  id?: string;
  collection_id: string;
  title: string;
  description?: string | null;
  provider: string;
  model: string;
  system_prompt: string;
  user_prompt: string;
  history_json?: string | null;
  variables_json?: string | null;
  params_json: string;
  response_format_json?: string | null;
  tools_json?: string | null;
  attachments_json?: string | null;
  provider_meta_json?: string | null;
  version?: number;
  created_at?: number;
  updated_at?: number;
  archived_at?: number | null;
}

export type PromptTemplate = {
  id?: string;
  type: "system" | "user";
  name: string;
  description?: string | null;
  content: string;
  variables_json?: string | null;
  last_used_at?: number | null;
  is_pinned?: number;
  created_at?: number;
  updated_at?: number;
  archived_at?: number | null;
};

export type Account = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null; // base64 data URL
  role?: string | null;
  use_case?: string | null;
  timezone?: string | null;
  usage_context?: "work" | "personal" | "education" | "other" | null;
  created_at?: number;
  updated_at?: number;
};

/** Agent record as stored in the agents table (snake_case) */
export type AgentRecord = {
  id: string;
  name: string;
  description?: string | null;
  provider: string;
  model: string;
  params_json: string;
  agent_goal?: string | null;
  system_instructions?: string | null;
  tools_json: string;
  max_iterations: number;
  timeout_seconds: number;
  retry_policy: string;
  tool_call_strategy: string;
  memory_enabled: number;
  memory_source: string;
  version?: number;
  created_at?: number;
  updated_at?: number;
  archived_at?: number | null;
};

export type Execution = {
  id?: string;
  type: ExecutionType;
  runnable_id: string;
  runnable_version?: number | null;
  snapshot_json: string;
  input_json?: string | null;
  request_json?: string | null;
  result_json?: string | null;
  tool_calls_json?: string | null;
  steps_json?: string | null;
  status: ExecutionStatus;
  started_at?: number | null;
  ended_at?: number | null;
  usage_json?: string | null;
  error_json?: string | null;
  created_at?: number;
  updated_at?: number;
};

/** Agent runtime UI state (distinct from Execution DB status) */
export type AgentExecutionStatus = "idle" | "running" | "success" | "error";

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