import { invoke } from '@tauri-apps/api/core';

// --- Executions ---
// Schema: type, runnable_id, runnable_version?, snapshot_json, input_json?, request_json?, result_json?,
//         status, started_at?, ended_at?, usage_json?, error_json?, created_at, updated_at

export type ExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type ExecutionType = 'scenario' | 'agent' | 'mcp';

export type ExecutionRow = {
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
};

export async function insertExecution(data: Omit<ExecutionRow, 'created_at' | 'updated_at'>): Promise<string> {
  const now = Date.now();
  const row: ExecutionRow = { ...data, created_at: now, updated_at: now };
  return invoke<string>('db_insert_cmd', { table: 'executions', data: row });
}

export async function updateExecution(id: string, data: Partial<Omit<ExecutionRow, 'created_at'>>): Promise<void> {
  const now = Date.now();
  const row = { ...data, updated_at: now };
  await invoke('db_update_cmd', {
    table: 'executions',
    query: { where: { id } },
    data: row,
  });
}

// --- Collections ---

export type CollectionRow = {
  name: string;
  description?: string;
  created_at: number;
  updated_at: number;
};

export async function findCollectionByName(name: string): Promise<{ id: string; name: string } | null> {
  const rows: { id: string; name: string }[] = await invoke('db_select_cmd', {
    table: 'collections',
    query: { where: { name } },
  });
  return rows.length > 0 ? rows[0] : null;
}

export async function insertCollection(data: CollectionRow): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'collections', data });
}

const DEFAULT_COLLECTION_NAME = 'Default Collection';

export async function getOrCreateDefaultCollection(): Promise<string> {
  const existing = await findCollectionByName(DEFAULT_COLLECTION_NAME);
  if (existing) return existing.id;

  const now = Date.now();
  const newCollection: CollectionRow = {
    name: DEFAULT_COLLECTION_NAME,
    created_at: now,
    updated_at: now,
    description: 'Default collection for scenarios',
  };
  const id = await insertCollection(newCollection);
  return id;
}

// --- Scenarios ---
// Schema: id, collection_id, title, description?, provider, model, system_prompt, user_prompt,
//         history_json?, variables_json?, params_json, response_format_json?, tools_json?, provider_meta_json?,
//         version, created_at, updated_at, archived_at?

export type ScenarioRow = {
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
  created_at: number;
  updated_at: number;
  archived_at?: number | null;
};

export async function insertScenario(data: Omit<ScenarioRow, 'created_at' | 'updated_at'>): Promise<string> {
  const now = Date.now();
  const row: ScenarioRow = {
    ...data,
    version: data.version ?? 1,
    created_at: now,
    updated_at: now,
  };
  return invoke<string>('db_insert_cmd', { table: 'scenarios', data: row });
}

export async function updateScenario(id: string, data: Partial<Omit<ScenarioRow, 'created_at'>>): Promise<void> {
  const now = Date.now();
  const row = { ...data, updated_at: now };
  await invoke('db_update_cmd', {
    table: 'scenarios',
    query: { where: { id } },
    data: row,
  });
}
