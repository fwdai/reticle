export type Page =
  | 'home'
  | 'scenarios'
  | 'agents'
  | 'tools'
  | 'runs'
  | 'settings'
  | 'templates';

export type SettingsSectionId =
  | 'preferences'
  | 'account'
  | 'api-keys'
  | 'env-variables';

export type SidebarItem = Exclude<Page, 'home'>;

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled';
export type ExecutionType = 'scenario' | 'agent';

export type LLMCallConfig = {
  provider: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
};

export type Collection = {
  id?: string;
  name: string;
  description?: string;
  created_at?: number;
  updated_at?: number;
  archived_at?: number | null;
};

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
};

export type PromptTemplate = {
  id?: string;
  type: 'system' | 'user';
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
  usage_context?: 'work' | 'personal' | 'education' | 'other' | null;
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

export type TelemetryEvent = {
  id?: string;
  name: string;
  attributes_json: string;
  trace_id?: string | null;
  span_id?: string | null;
  occurred_at: number;
  created_at?: number;
  updated_at?: number;
};

/** Agent runtime UI state (distinct from Execution DB status) */
export type AgentExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export type StepStatus = 'success' | 'error' | 'running' | 'pending';

export type StepType =
  | 'task_input'
  | 'reasoning'
  | 'model_call'
  | 'model_response'
  | 'tool_call'
  | 'tool_response'
  | 'memory_read'
  | 'memory_write'
  | 'decision'
  | 'output'
  | 'error';

export interface ExecutionStep {
  id: string;
  type: StepType;
  label: string;
  status: StepStatus;
  loop?: number;
  timestamp: string;
  duration?: string;
  tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  content: string;
  meta?: Record<string, string>;
  processingMs?: number;
}

export type StepPhase = 'hidden' | 'appearing' | 'processing' | 'done';

// ── Evals ─────────────────────────────────────────────────────────────────────

export type EvalRunnableType = 'scenario' | 'agent';

export type EvalAssertionType =
  | 'contains'
  | 'equals'
  | 'not_contains'
  | 'tool_called'
  | 'tool_not_called'
  | 'loop_count';

/** A single assertion within a test case */
export interface EvalAssertionItem {
  type: EvalAssertionType;
  /** Tool name, expected string, or loop count as string */
  value: string;
}

/** An assertion item with its outcome after a run */
export interface EvalAssertionResult extends EvalAssertionItem {
  passed: boolean;
}

export type EvalTestCase = {
  id?: string;
  runnable_id: string;
  runnable_type: EvalRunnableType;
  sort_order?: number;
  /**
   * Scenario: { "variable": "value" }
   * Agent:    { "task": "..." }  — extensible (files etc.) in the future
   */
  inputs_json: string;
  /** JSON-serialised EvalAssertionItem[] */
  assertions_json: string;
  created_at?: number;
  updated_at?: number;
};

export type EvalRunStatus = 'running' | 'completed' | 'failed';

export type EvalRun = {
  id?: string;
  runnable_id: string;
  runnable_type: EvalRunnableType;
  /** Frozen copy of prompt / model / params at time of run */
  snapshot_json: string;
  status: EvalRunStatus;
  started_at?: number | null;
  ended_at?: number | null;
  pass_count?: number;
  fail_count?: number;
  error_count?: number;
  total_cost_usd?: number | null;
  avg_latency_ms?: number | null;
  created_at?: number;
  updated_at?: number;
};

export type EvalResultStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error';

export type EvalResult = {
  id?: string;
  eval_run_id: string;
  /** SET NULL if the source test case is later deleted */
  test_case_id?: string | null;
  sort_order?: number;
  /** Snapshot of inputs at time of run */
  inputs_json: string;
  /** Snapshot of EvalAssertionItem[] at time of run */
  assertions_json: string;
  status: EvalResultStatus;
  actual_output?: string | null;
  /** JSON-serialised EvalAssertionResult[] — per-assertion outcomes */
  assertions_result_json?: string | null;
  /** 1 = all assertions passed, 0 = any failed, null = error/pending */
  passed?: number | null;
  latency_ms?: number | null;
  cost_usd?: number | null;
  usage_json?: string | null;
  error?: string | null;
  created_at?: number;
  updated_at?: number;
};
