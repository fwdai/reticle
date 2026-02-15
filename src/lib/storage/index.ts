import { invoke } from '@tauri-apps/api/core';
import { Collection, Execution, PromptTemplate, Scenario } from '@/types';

const DEFAULT_COLLECTION_NAME = 'Default Collection';

export async function insertExecution(data: Execution): Promise<string> {
  // created_at and updated_at are now handled by the backend
  return invoke<string>('db_insert_cmd', { table: 'executions', data: data });
}

export async function updateExecution(id: string, data: Execution): Promise<void> {
  // updated_at is now handled by the backend
  await invoke('db_update_cmd', {
    table: 'executions',
    query: { where: { id } },
    data: data,
  });
}

export interface ListExecutionsOptions {
  offset?: number;
  limit?: number;
}

export async function listExecutions(options?: ListExecutionsOptions): Promise<Execution[]> {
  const { offset = 0, limit } = options ?? {};
  const query: Record<string, unknown> = {
    orderBy: 'started_at',
    orderDirection: 'desc',
  };
  if (offset > 0) query.offset = offset;
  if (limit != null && limit > 0) query.limit = limit;

  const rows = await invoke<Execution[]>('db_select_cmd', {
    table: 'executions',
    query,
  });
  return Array.isArray(rows) ? rows : [];
}

export async function countExecutions(): Promise<number> {
  const count = await invoke<number>('db_count_cmd', {
    table: 'executions',
    query: {},
  });
  return typeof count === 'number' ? count : 0;
}

export async function listScenarios(): Promise<Scenario[]> {
  const rows = await invoke<Scenario[]>('db_select_cmd', {
    table: 'scenarios',
    query: {},
  });
  return Array.isArray(rows) ? rows : [];
}

// --- Collections ---
export async function findCollectionByName(name: string): Promise<{ id: string; name: string } | null> {
  const rows: { id: string; name: string }[] = await invoke('db_select_cmd', {
    table: 'collections',
    query: { where: { name } },
  });
  return rows.length > 0 ? rows[0] : null;
}

export async function insertCollection(data: Collection): Promise<string> {
  // created_at and updated_at for collections are also handled by the backend
  return invoke<string>('db_insert_cmd', { table: 'collections', data });
}

export async function getOrCreateDefaultCollection(): Promise<string> {
  const existing = await findCollectionByName(DEFAULT_COLLECTION_NAME);
  if (existing) return existing.id;

  const newCollection: Collection = {
    name: DEFAULT_COLLECTION_NAME,
    description: 'Default collection for scenarios',
  };
  const id = await insertCollection(newCollection);
  return id;
}

// --- Scenarios ---
export async function insertScenario(data: Scenario): Promise<string> {
  // created_at and updated_at are now handled by the backend
  const row: Scenario = {
    ...data,
    version: data.version ?? 1, // version still needs to be handled
  };
  return invoke<string>('db_insert_cmd', { table: 'scenarios', data: row });
}

export async function updateScenario(id: string, data: Scenario): Promise<void> {
  // updated_at is now handled by the backend
  await invoke('db_update_cmd', {
    table: 'scenarios',
    query: { where: { id } },
    data: data,
  });
}

// --- Prompt Templates ---
export async function listPromptTemplates(): Promise<PromptTemplate[]> {
  const rows = await invoke<PromptTemplate[]>('db_select_cmd', {
    table: 'prompt_templates',
    query: { orderBy: 'updated_at', orderDirection: 'desc' },
  });
  return Array.isArray(rows) ? rows : [];
}

export async function insertPromptTemplate(data: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'prompt_templates', data });
}

export async function updatePromptTemplate(id: string, data: Partial<PromptTemplate>): Promise<void> {
  await invoke('db_update_cmd', {
    table: 'prompt_templates',
    query: { where: { id } },
    data,
  });
}

export async function deletePromptTemplate(id: string): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'prompt_templates',
    query: { where: { id } },
  });
}
