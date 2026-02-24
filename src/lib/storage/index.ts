import { invoke } from '@tauri-apps/api/core';
import {
  Account,
  AgentRecord,
  Collection,
  Execution,
  PromptTemplate,
  Scenario,
  TelemetryEvent,
} from '@/types';
import type { AttachedFile } from '@/contexts/StudioContext';
import type {
  Tool,
  ToolParameter,
} from '@/features/Scenarios/MainContent/Editor/Main/Tools/types';

const DEFAULT_COLLECTION_NAME = 'Default Collection';

export async function insertExecution(data: Execution): Promise<string> {
  // created_at and updated_at are now handled by the backend
  return invoke<string>('db_insert_cmd', { table: 'executions', data: data });
}

export async function updateExecution(
  id: string,
  data: Execution
): Promise<void> {
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

export async function listExecutions(
  options?: ListExecutionsOptions
): Promise<Execution[]> {
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

export async function getLastExecutionForScenario(
  scenarioId: string
): Promise<Execution | null> {
  const rows = await invoke<Execution[]>('db_select_cmd', {
    table: 'executions',
    query: {
      where: { type: 'scenario', runnable_id: scenarioId },
      orderBy: 'started_at',
      orderDirection: 'desc',
      limit: 1,
    },
  });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function getExecutionById(id: string): Promise<Execution | null> {
  const rows = await invoke<Execution[]>('db_select_cmd', {
    table: 'executions',
    query: { where: { id }, limit: 1 },
  });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// --- Telemetry Events ---

export type InsertTelemetryEventInput = Omit<
  TelemetryEvent,
  'id' | 'created_at' | 'updated_at'
>;

export interface ListTelemetryEventsOptions {
  name?: string;
  trace_id?: string;
  offset?: number;
  limit?: number;
  orderDirection?: 'asc' | 'desc';
}

export async function insertTelemetryEvent(
  data: InsertTelemetryEventInput
): Promise<string> {
  return invoke<string>('db_insert_cmd', {
    table: 'telemetry_events',
    data,
  });
}

export async function listTelemetryEvents(
  options?: ListTelemetryEventsOptions
): Promise<TelemetryEvent[]> {
  const {
    name,
    trace_id,
    offset = 0,
    limit,
    orderDirection = 'desc',
  } = options ?? {};

  const where: Record<string, string> = {};
  if (name) where.name = name;
  if (trace_id) where.trace_id = trace_id;

  const query: Record<string, unknown> = {
    orderBy: 'occurred_at',
    orderDirection,
  };

  if (Object.keys(where).length > 0) {
    query.where = where;
  }
  if (offset > 0) {
    query.offset = offset;
  }
  if (limit != null && limit > 0) {
    query.limit = limit;
  }

  const rows = await invoke<TelemetryEvent[]>('db_select_cmd', {
    table: 'telemetry_events',
    query,
  });

  return Array.isArray(rows) ? rows : [];
}

export async function countTelemetryEvents(
  where?: Pick<TelemetryEvent, 'name' | 'trace_id'>
): Promise<number> {
  const query = where != null ? { where } : {};
  const count = await invoke<number>('db_count_cmd', {
    table: 'telemetry_events',
    query,
  });
  return typeof count === 'number' ? count : 0;
}

export async function deleteTelemetryEvents(
  where?: Partial<Pick<TelemetryEvent, 'id' | 'name' | 'trace_id'>>
): Promise<number> {
  const query = where != null ? { where } : {};
  const deleted = await invoke<number>('db_delete_cmd', {
    table: 'telemetry_events',
    query,
  });
  return typeof deleted === 'number' ? deleted : 0;
}

export async function listScenarios(): Promise<Scenario[]> {
  const rows = await invoke<Scenario[]>('db_select_cmd', {
    table: 'scenarios',
    query: {},
  });
  return Array.isArray(rows) ? rows : [];
}

// --- Collections ---
export async function findCollectionByName(
  name: string
): Promise<{ id: string; name: string } | null> {
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

export async function updateScenario(
  id: string,
  data: Scenario
): Promise<void> {
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

export async function insertPromptTemplate(
  data: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'prompt_templates', data });
}

export async function updatePromptTemplate(
  id: string,
  data: Partial<PromptTemplate>
): Promise<void> {
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

// --- Agents ---

export async function listAgents(): Promise<AgentRecord[]> {
  const rows = await invoke<AgentRecord[]>('db_select_cmd', {
    table: 'agents',
    query: {
      orderBy: 'updated_at',
      orderDirection: 'desc',
    },
  });
  const arr = Array.isArray(rows) ? rows : [];
  return arr.filter(r => r.archived_at == null);
}

export async function getAgentById(id: string): Promise<AgentRecord | null> {
  const rows = await invoke<AgentRecord[]>('db_select_cmd', {
    table: 'agents',
    query: { where: { id }, limit: 1 },
  });
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function insertAgent(
  data: Omit<AgentRecord, 'id' | 'created_at' | 'updated_at' | 'archived_at'>
): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'agents', data });
}

export async function updateAgent(
  id: string,
  data: Partial<AgentRecord>
): Promise<void> {
  await invoke('db_update_cmd', {
    table: 'agents',
    query: { where: { id } },
    data,
  });
}

/** Map AgentRecord to list-card shape (status, toolsCount, etc.). */
export function agentRecordToListAgent(record: AgentRecord): {
  id: string;
  name: string;
  description: string;
  status: 'ready' | 'needs-config' | 'error' | 'running';
  model: string;
  toolsCount: number;
  memoryEnabled: boolean;
  starred: boolean;
} {
  const tools = parseJsonArray(record.tools_json);
  const hasGoal = !!record.agent_goal?.trim();
  const hasInstructions = !!record.system_instructions?.trim();
  const status: 'ready' | 'needs-config' =
    hasGoal && hasInstructions ? 'ready' : 'needs-config';
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? '',
    status,
    model: record.model,
    toolsCount: tools.length,
    memoryEnabled: record.memory_enabled === 1,
    starred: false,
  };
}

function parseJsonArray(json: string): unknown[] {
  try {
    const v = JSON.parse(json ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// --- Accounts ---

export async function getOrCreateAccount(): Promise<Account> {
  const rows: Account[] = await invoke('db_select_cmd', {
    table: 'accounts',
    query: {},
  });
  const existing = rows.length > 0 ? rows[0] : null;
  if (existing) return existing;

  const id = await invoke<string>('db_insert_cmd', {
    table: 'accounts',
    data: {},
  });
  const inserted: Account[] = await invoke('db_select_cmd', {
    table: 'accounts',
    query: { where: { id } },
  });
  return inserted[0] ?? { id };
}

/**
 * Upserts account: inserts if table is empty, updates if account exists.
 */
export async function upsertAccount(
  data: Partial<
    Pick<
      Account,
      | 'first_name'
      | 'last_name'
      | 'avatar'
      | 'role'
      | 'use_case'
      | 'timezone'
      | 'usage_context'
    >
  >
): Promise<Account> {
  const rows: Account[] = await invoke('db_select_cmd', {
    table: 'accounts',
    query: {},
  });
  const existing = rows.length > 0 ? rows[0] : null;
  const payload = {
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    avatar: data.avatar ?? null,
    role: data.role ?? null,
    use_case: data.use_case ?? null,
    timezone: data.timezone ?? null,
    usage_context: data.usage_context ?? null,
  };

  if (existing?.id) {
    await invoke('db_update_cmd', {
      table: 'accounts',
      query: { where: { id: existing.id } },
      data: payload,
    });
    return { ...existing, ...payload };
  }

  const id = await invoke<string>('db_insert_cmd', {
    table: 'accounts',
    data: payload,
  });
  const inserted: Account[] = await invoke('db_select_cmd', {
    table: 'accounts',
    query: { where: { id } },
  });
  return inserted[0] ?? { id, ...payload };
}

// --- Tools ---

/** DB row shape for tools table (snake_case columns) */
interface ToolDbRow {
  id?: string;
  scenario_id: string;
  name: string;
  description: string;
  parameters_json: string;
  mock_response: string;
  mock_mode: 'json' | 'code';
  code?: string | null;
  is_enabled?: number;
  sort_order?: number;
}

function toolToDbRow(tool: Tool, scenarioId: string, sortOrder = 0): ToolDbRow {
  return {
    id: tool.id,
    scenario_id: scenarioId,
    name: tool.name,
    description: tool.description,
    parameters_json: JSON.stringify(tool.parameters),
    mock_response: tool.mockResponse,
    mock_mode: tool.mockMode ?? 'json',
    code: null,
    is_enabled: 1,
    sort_order: sortOrder,
  };
}

function dbRowToTool(row: Record<string, unknown>): Tool {
  const paramsRaw = JSON.parse((row.parameters_json as string) ?? '[]');
  const parameters = Array.isArray(paramsRaw)
    ? paramsRaw.map((p: Record<string, unknown>) => ({
        id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
        name: typeof p.name === 'string' ? p.name : '',
        type: ['string', 'number', 'boolean', 'object', 'array'].includes(
          String(p.type)
        )
          ? (p.type as ToolParameter['type'])
          : 'string',
        description: typeof p.description === 'string' ? p.description : '',
        required: p.required === true,
      }))
    : [];
  return {
    id: (row.id as string) ?? crypto.randomUUID(),
    name: (row.name as string) ?? '',
    description: (row.description as string) ?? '',
    parameters,
    mockResponse: (row.mock_response as string) ?? '{}',
    mockMode:
      row.mock_mode === 'code' || row.mock_mode === 'json'
        ? row.mock_mode
        : 'json',
  };
}

export async function insertTool(
  tool: Tool,
  scenarioId: string,
  sortOrder = 0
): Promise<string> {
  const data = toolToDbRow(tool, scenarioId, sortOrder);
  return invoke<string>('db_insert_cmd', { table: 'tools', data });
}

export async function updateTool(
  id: string,
  updates: Partial<Tool>
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.parameters !== undefined)
    data.parameters_json = JSON.stringify(updates.parameters);
  if (updates.mockResponse !== undefined)
    data.mock_response = updates.mockResponse;
  if (updates.mockMode !== undefined) data.mock_mode = updates.mockMode;
  if (Object.keys(data).length === 0) return;
  await invoke('db_update_cmd', {
    table: 'tools',
    query: { where: { id } },
    data,
  });
}

export async function countToolsByScenarioId(
  scenarioId: string
): Promise<number> {
  const count = await invoke<number>('db_count_cmd', {
    table: 'tools',
    query: { where: { scenario_id: scenarioId } },
  });
  return typeof count === 'number' ? count : 0;
}

export async function listToolsByScenarioId(
  scenarioId: string
): Promise<Tool[]> {
  const rows = await invoke<Record<string, unknown>[]>('db_select_cmd', {
    table: 'tools',
    query: {
      where: { scenario_id: scenarioId },
      orderBy: 'sort_order',
      orderDirection: 'asc',
    },
  });
  return Array.isArray(rows) ? rows.map(dbRowToTool) : [];
}

export async function deleteTool(id: string): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'tools',
    query: { where: { id } },
  });
}

export async function deleteToolsByScenarioId(
  scenarioId: string
): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'tools',
    query: { where: { scenario_id: scenarioId } },
  });
}

// --- Attachments ---

export async function insertAttachment(
  attachment: AttachedFile,
  scenarioId: string,
  sortOrder: number
): Promise<string> {
  const data = {
    id: attachment.id,
    scenario_id: scenarioId,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    path: attachment.path ?? null,
    sort_order: sortOrder,
  };
  return invoke<string>('db_insert_cmd', { table: 'attachments', data });
}

export async function countAttachmentsByScenarioId(
  scenarioId: string
): Promise<number> {
  const count = await invoke<number>('db_count_cmd', {
    table: 'attachments',
    query: { where: { scenario_id: scenarioId } },
  });
  return typeof count === 'number' ? count : 0;
}

export async function listAttachmentsByScenarioId(
  scenarioId: string
): Promise<AttachedFile[]> {
  const rows = await invoke<Record<string, unknown>[]>('db_select_cmd', {
    table: 'attachments',
    query: {
      where: { scenario_id: scenarioId },
      orderBy: 'sort_order',
      orderDirection: 'asc',
    },
  });
  if (!Array.isArray(rows)) return [];
  return rows.map(row => ({
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    size: Number(row.size ?? 0),
    type: String(row.type ?? 'application/octet-stream'),
    path: typeof row.path === 'string' && row.path ? row.path : undefined,
  }));
}

export async function deleteAttachmentsByScenarioId(
  scenarioId: string
): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'attachments',
    query: { where: { scenario_id: scenarioId } },
  });
}

export async function deleteAttachmentById(id: string): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'attachments',
    query: { where: { id } },
  });
}

/**
 * Replace all attachments for a scenario with the given list.
 */
export async function upsertAttachmentsForScenario(
  attachments: AttachedFile[],
  scenarioId: string
): Promise<void> {
  await deleteAttachmentsByScenarioId(scenarioId);
  for (let i = 0; i < attachments.length; i++) {
    await insertAttachment(attachments[i], scenarioId, i);
  }
}

/**
 * Replace all tools for a scenario: deletes existing (including archived) and inserts the new list.
 */
export async function upsertToolsForScenario(
  tools: Tool[],
  scenarioId: string
): Promise<void> {
  await deleteToolsByScenarioId(scenarioId);
  for (let i = 0; i < tools.length; i++) {
    await insertTool(tools[i], scenarioId, i);
  }
}

// --- Settings (key-value) ---

export async function getSetting(key: string): Promise<string | null> {
  const rows: { key: string; value: string }[] = await invoke('db_select_cmd', {
    table: 'settings',
    query: { where: { key } },
  });
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await getSetting(key);
  if (existing !== null) {
    await invoke('db_update_cmd', {
      table: 'settings',
      query: { where: { key } },
      data: { value },
    });
  } else {
    await invoke('db_insert_cmd', {
      table: 'settings',
      data: { key, value },
    });
  }
}
