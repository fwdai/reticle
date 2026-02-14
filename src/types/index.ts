export type Page = "home" | "studio" | "environments" | "runs" | "settings" | "templates";

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
  provider_meta_json?: string | null;
  version?: number;
  created_at?: number;
  updated_at?: number;
  archived_at?: number | null;
}

export type Execution = {
  id?: string;
  type: ExecutionType;
  runnable_id: string;
  runnable_version?: number | null;
  snapshot_json: string;
  input_json?: string | null;
  request_json?: string | null;
  result_json?: string | null;
  status: ExecutionStatus;
  started_at?: number | null;
  ended_at?: number | null;
  usage_json?: string | null;
  error_json?: string | null;
  created_at?: number;
  updated_at?: number;
}