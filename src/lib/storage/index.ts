import { invoke } from '@tauri-apps/api/core';
import {
  Account,
  AgentRecord,
  Collection,
  Execution,
  ExecutionStatus,
  ExecutionType,
  EvalTestCase,
  EvalRun,
  EvalResult,
  EvalRunnableType,
  PromptTemplate,
  Scenario,
  TelemetryEvent,
} from '@/types';
import type { AttachedFile } from '@/contexts/StudioContext';
import type {
  Tool,
  ToolParameter,
} from '@/components/Tools/types';

const DEFAULT_COLLECTION_NAME = 'Default Collection';

// --- DB helpers ---

async function dbSelect<T>(table: string, query: Record<string, unknown> = {}): Promise<T[]> {
  const rows = await invoke<T[]>('db_select_cmd', { table, query });
  return Array.isArray(rows) ? rows : [];
}

async function dbSelectOne<T>(table: string, query: Record<string, unknown> = {}): Promise<T | null> {
  const rows = await dbSelect<T>(table, { ...query, limit: 1 });
  return rows[0] ?? null;
}

async function dbUpsert(
  table: string,
  where: Record<string, unknown>,
  insertData: Record<string, unknown>,
  updateData: Record<string, unknown> = insertData
): Promise<void> {
  const existing = await dbSelectOne<{ id?: string }>(table, { where });
  if (existing) {
    const updateWhere = existing.id != null ? { id: existing.id } : where;
    await invoke('db_update_cmd', { table, query: { where: updateWhere }, data: updateData });
  } else {
    await invoke('db_insert_cmd', { table, data: insertData });
  }
}

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
  type?: ExecutionType;
  status?: ExecutionStatus;
  runnableId?: string;
}

export async function listExecutions(
  options?: ListExecutionsOptions
): Promise<Execution[]> {
  const { offset = 0, limit, type, status, runnableId } = options ?? {};

  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(runnableId && { runnable_id: runnableId }),
  };

  return dbSelect<Execution>('executions', {
    orderBy: 'started_at',
    orderDirection: 'desc',
    ...(offset > 0 && { offset }),
    ...(limit != null && limit > 0 && { limit }),
    ...(Object.keys(where).length > 0 && { where }),
  });
}

export interface EnvVariable { id: string; key: string; value: string; is_secret: number; }

export async function listEnvVariables(): Promise<EnvVariable[]> {
  return dbSelect<EnvVariable>('env_variables', { orderBy: 'created_at', orderDirection: 'asc' });
}

export interface AgentMemory { id: string; agent_id: string; key: string; value: string; created_at: number; updated_at: number; }

export async function listAgentMemories(agentId: string): Promise<AgentMemory[]> {
  return dbSelect<AgentMemory>('agent_memories', { where: { agent_id: agentId }, orderBy: 'created_at', orderDirection: 'asc' });
}

export async function saveAgentMemory(agentId: string, key: string, value: string): Promise<void> {
  const now = Date.now();
  await dbUpsert(
    'agent_memories',
    { agent_id: agentId, key },
    { agent_id: agentId, key, value, created_at: now, updated_at: now },
    { value, updated_at: now }
  );
}

export async function deleteAgentMemory(id: string): Promise<void> {
  await invoke('db_delete_cmd', { table: 'agent_memories', query: { where: { id } } });
}

export async function clearAgentMemories(agentId: string): Promise<void> {
  await invoke('db_delete_cmd', { table: 'agent_memories', query: { where: { agent_id: agentId } } });
}

/** Check if user has configured at least one API key */
export async function hasApiKeys(): Promise<boolean> {
  const rows = await dbSelect<{ provider: string }>('api_keys');
  return rows.length > 0;
}

export interface CountExecutionsOptions {
  type?: ExecutionType;
  status?: ExecutionStatus;
}

export async function countExecutions(options?: CountExecutionsOptions): Promise<number> {
  const query: Record<string, unknown> = {};
  const where: Record<string, unknown> = {};
  if (options?.type) where.type = options.type;
  if (options?.status) where.status = options.status;
  if (Object.keys(where).length > 0) query.where = where;

  const count = await invoke<number>('db_count_cmd', {
    table: 'executions',
    query,
  });
  return typeof count === 'number' ? count : 0;
}

export async function getLastExecutionForScenario(
  scenarioId: string
): Promise<Execution | null> {
  return dbSelectOne<Execution>('executions', {
    where: { type: 'scenario', runnable_id: scenarioId },
    orderBy: 'started_at',
    orderDirection: 'desc',
  });
}

export async function getExecutionById(id: string): Promise<Execution | null> {
  return dbSelectOne<Execution>('executions', { where: { id } });
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

  return dbSelect<TelemetryEvent>('telemetry_events', query);
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
  return dbSelect<Scenario>('scenarios');
}

// --- Collections ---
export async function findCollectionByName(
  name: string
): Promise<{ id: string; name: string } | null> {
  return dbSelectOne<{ id: string; name: string }>('collections', { where: { name } });
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
export type ListPromptTemplatesOptions = {
  /** 'exclude' (default): only non-archived; 'only': only archived; 'all': no filter */
  archived?: 'exclude' | 'only' | 'all';
};

export async function listPromptTemplates(
  options?: ListPromptTemplatesOptions
): Promise<PromptTemplate[]> {
  const arr = await dbSelect<PromptTemplate>('prompt_templates', { orderBy: 'updated_at', orderDirection: 'desc' });
  const archived = options?.archived ?? 'exclude';
  if (archived === 'exclude') {
    return arr.filter((r) => r.archived_at == null);
  }
  if (archived === 'only') {
    return arr.filter((r) => r.archived_at != null);
  }
  return arr;
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
  const rows = await dbSelect<AgentRecord>('agents', { orderBy: 'updated_at', orderDirection: 'desc' });
  return rows.filter(r => r.archived_at == null);
}

export async function getAgentById(id: string): Promise<AgentRecord | null> {
  return dbSelectOne<AgentRecord>('agents', { where: { id } });
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
    description: record.agent_goal?.trim() || record.description || '',
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
  const existing = await dbSelectOne<Account>('accounts');
  if (existing) return existing;

  const id = await invoke<string>('db_insert_cmd', {
    table: 'accounts',
    data: {},
  });
  const inserted = await dbSelectOne<Account>('accounts', { where: { id } });
  return inserted ?? { id };
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
  const existing = await dbSelectOne<Account>('accounts');
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
  const inserted = await dbSelectOne<Account>('accounts', { where: { id } });
  return inserted ?? { id, ...payload };
}

// --- Tools ---

/** DB row shape for tools table (snake_case columns) */
interface ToolDbRow {
  id?: string;
  name: string;
  description: string;
  parameters_json: string;
  mock_response: string;
  mock_mode: 'json' | 'code';
  code?: string | null;
  is_enabled?: number;
  is_global?: number;
  sort_order?: number;
}

function toolToDbRow(tool: Tool, sortOrder = 0): ToolDbRow {
  return {
    id: tool.id,
    name: tool.name,
    description: tool.description,
    parameters_json: JSON.stringify(tool.parameters),
    mock_response: tool.mockResponse,
    mock_mode: tool.mockMode ?? 'json',
    code: tool.code ?? null,
    is_enabled: 1,
    is_global: tool.isShared ? 1 : 0,
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
    code: typeof row.code === 'string' ? row.code : undefined,
    isShared: row.is_global === 1,
  };
}

export async function linkTool(
  toolId: string,
  toolableId: string,
  toolableType: 'scenario' | 'agent'
): Promise<void> {
  try {
    await invoke('db_insert_cmd', {
      table: 'tool_links',
      data: { tool_id: toolId, toolable_id: toolableId, toolable_type: toolableType },
    });
  } catch {
    // Ignore UNIQUE constraint violations (already linked)
  }
}

export async function unlinkTool(
  toolId: string,
  toolableId: string,
  toolableType: 'scenario' | 'agent'
): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'tool_links',
    query: { where: { tool_id: toolId, toolable_id: toolableId, toolable_type: toolableType } },
  });
}

export async function getLinkedToolIds(
  toolableId: string,
  toolableType: 'scenario' | 'agent'
): Promise<string[]> {
  const links = await dbSelect<{ tool_id: string }>('tool_links', { where: { toolable_id: toolableId, toolable_type: toolableType } });
  return links.map(l => l.tool_id);
}

export async function insertTool(
  tool: Tool,
  toolableId: string,
  toolableType: 'scenario' | 'agent',
  sortOrder = 0
): Promise<string> {
  const data = toolToDbRow(tool, sortOrder);
  const toolId = await invoke<string>('db_insert_cmd', { table: 'tools', data });
  await linkTool(toolId, toolableId, toolableType);
  return toolId;
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
  if (updates.code !== undefined) data.code = updates.code;
  if (updates.isShared !== undefined) data.is_global = updates.isShared ? 1 : 0;
  if (Object.keys(data).length === 0) return;
  await invoke('db_update_cmd', {
    table: 'tools',
    query: { where: { id } },
    data,
  });
}

/** Set a tool back to local: delete all its links, re-link to given entity only, set is_global=0 */
export async function unsharedTool(toolId: string, scenarioId: string): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'tool_links',
    query: { where: { tool_id: toolId } },
  });
  await linkTool(toolId, scenarioId, 'scenario');
  await invoke('db_update_cmd', {
    table: 'tools',
    query: { where: { id: toolId } },
    data: { is_global: 0 },
  });
}

export async function countToolsByScenarioId(
  scenarioId: string
): Promise<number> {
  const count = await invoke<number>('db_count_cmd', {
    table: 'tool_links',
    query: { where: { toolable_id: scenarioId, toolable_type: 'scenario' } },
  });
  return typeof count === 'number' ? count : 0;
}

export async function listToolsByScenarioId(scenarioId: string): Promise<Tool[]> {
  return listToolsForEntity(scenarioId, 'scenario', { excludeShared: true });
}

export interface ToolMeta {
  updatedAt: number | null;
  usedBy: number;
}

export async function listSharedToolsWithMeta(): Promise<(Tool & ToolMeta)[]> {
  const tools = await dbSelect<Record<string, unknown>>('tools', { where: { is_global: 1 }, orderBy: 'name', orderDirection: 'asc' });
  const toolIds = tools.map(r => r.id as string);

  let linkCounts: Record<string, number> = {};
  if (toolIds.length > 0) {
    const allLinks = await dbSelect<{ tool_id: string }>('tool_links');
    const relevantIds = new Set(toolIds);
    for (const link of allLinks) {
      if (relevantIds.has(link.tool_id)) {
        linkCounts[link.tool_id] = (linkCounts[link.tool_id] ?? 0) + 1;
      }
    }
  }

  return tools.map(row => ({
    ...dbRowToTool(row),
    updatedAt: typeof row.updated_at === 'number' ? row.updated_at : null,
    usedBy: linkCounts[row.id as string] ?? 0,
  }));
}

export async function getToolMeta(toolId: string): Promise<ToolMeta> {
  const row = await dbSelectOne<Record<string, unknown>>('tools', { where: { id: toolId } });
  const updatedAt = row && typeof row.updated_at === 'number' ? row.updated_at : null;

  const links = await dbSelect<{ tool_id: string }>('tool_links', { where: { tool_id: toolId } });
  const usedBy = links.length;

  return { updatedAt, usedBy };
}

export async function insertGlobalTool(tool: Tool): Promise<string> {
  const data = toolToDbRow({ ...tool, isShared: true });
  return invoke<string>('db_insert_cmd', { table: 'tools', data });
}

export async function listSharedTools(): Promise<Tool[]> {
  const rows = await dbSelect<Record<string, unknown>>('tools', { where: { is_global: 1 }, orderBy: 'name', orderDirection: 'asc' });
  return rows.map(dbRowToTool);
}

export async function listToolsForEntity(
  toolableId: string,
  toolableType: 'scenario' | 'agent',
  options: { excludeShared?: boolean } = {}
): Promise<Tool[]> {
  const links = await dbSelect<{ tool_id: string }>('tool_links', { where: { toolable_id: toolableId, toolable_type: toolableType } });
  const toolIds = links.map(l => l.tool_id);
  if (toolIds.length === 0) return [];

  const allRows = await dbSelect<Record<string, unknown>>('tools', { orderBy: 'sort_order', orderDirection: 'asc' });
  return allRows
    .filter(r => toolIds.includes(r.id as string) && (!options.excludeShared || r.is_global === 0))
    .map(dbRowToTool);
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
  const links = await dbSelect<{ tool_id: string }>('tool_links', { where: { toolable_id: scenarioId, toolable_type: 'scenario' } });
  // Delete local (non-global) tools only — ON DELETE CASCADE removes their tool_links rows.
  // Global tools (is_global=1) are left intact; their links to this scenario are preserved.
  for (const link of links) {
    await invoke('db_delete_cmd', {
      table: 'tools',
      query: { where: { id: link.tool_id, is_global: 0 } },
    });
  }
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
  const rows = await dbSelect<Record<string, unknown>>('attachments', {
    where: { scenario_id: scenarioId },
    orderBy: 'sort_order',
    orderDirection: 'asc',
  });
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
 * Sync tools for a scenario. Tools are already individually persisted via addTool/updateTool/
 * removeTool, so this only needs to insert tools that aren't in the DB yet (e.g. tools added
 * before the scenario was first saved) and ensure their links exist.
 */
export async function upsertToolsForScenario(
  tools: Tool[],
  scenarioId: string
): Promise<void> {
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    const existing = await dbSelectOne<unknown>('tools', { where: { id: tool.id } });
    if (!existing) {
      await insertTool(tool, scenarioId, 'scenario', i);
    } else {
      await linkTool(tool.id, scenarioId, 'scenario');
    }
  }
}

// --- Settings (key-value) ---

export async function getSetting(key: string): Promise<string | null> {
  const row = await dbSelectOne<{ key: string; value: string }>('settings', { where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await dbUpsert('settings', { key }, { key, value }, { value });
}

// ── Eval test cases ────────────────────────────────────────────────────────────

export async function listEvalTestCases(
  runnableId: string,
  runnableType: EvalRunnableType
): Promise<EvalTestCase[]> {
  return dbSelect<EvalTestCase>('eval_test_cases', {
    where: { runnable_id: runnableId, runnable_type: runnableType },
    orderBy: 'sort_order',
    orderDirection: 'asc',
  });
}

export async function insertEvalTestCase(data: EvalTestCase): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'eval_test_cases', data });
}

export async function updateEvalTestCase(id: string, data: Partial<EvalTestCase>): Promise<void> {
  await invoke('db_update_cmd', {
    table: 'eval_test_cases',
    query: { where: { id } },
    data,
  });
}

export async function deleteEvalTestCase(id: string): Promise<void> {
  await invoke('db_delete_cmd', {
    table: 'eval_test_cases',
    query: { where: { id } },
  });
}

/** Sync the test case list for a runnable: update existing, insert new, delete removed.
 *  IDs are stable across saves so eval_results.test_case_id foreign keys stay intact. */
export async function syncEvalTestCases(
  runnableId: string,
  runnableType: EvalRunnableType,
  cases: Array<{ id: string } & Pick<EvalTestCase, 'inputs_json' | 'assertions_json'>>
): Promise<void> {
  const existing = await listEvalTestCases(runnableId, runnableType);
  const existingIds = new Set(existing.map(c => c.id!));
  const incomingIds = new Set(cases.map(c => c.id));

  for (const id of existingIds) {
    if (!incomingIds.has(id)) await deleteEvalTestCase(id);
  }

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (existingIds.has(c.id)) {
      await updateEvalTestCase(c.id, { inputs_json: c.inputs_json, assertions_json: c.assertions_json, sort_order: i });
    } else {
      await insertEvalTestCase({ id: c.id, runnable_id: runnableId, runnable_type: runnableType, sort_order: i, inputs_json: c.inputs_json, assertions_json: c.assertions_json });
    }
  }
}

// ── Eval runs ──────────────────────────────────────────────────────────────────

export async function insertEvalRun(data: EvalRun): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'eval_runs', data });
}

export async function updateEvalRun(id: string, data: Partial<EvalRun>): Promise<void> {
  await invoke('db_update_cmd', {
    table: 'eval_runs',
    query: { where: { id } },
    data,
  });
}

export async function listEvalRuns(
  runnableId: string,
  runnableType: EvalRunnableType
): Promise<EvalRun[]> {
  return dbSelect<EvalRun>('eval_runs', {
    where: { runnable_id: runnableId, runnable_type: runnableType },
    orderBy: 'created_at',
    orderDirection: 'desc',
  });
}

export async function getEvalRun(id: string): Promise<EvalRun | null> {
  return dbSelectOne<EvalRun>('eval_runs', { where: { id } });
}

// ── Eval results ───────────────────────────────────────────────────────────────

export async function insertEvalResult(data: EvalResult): Promise<string> {
  return invoke<string>('db_insert_cmd', { table: 'eval_results', data });
}

export async function updateEvalResult(id: string, data: Partial<EvalResult>): Promise<void> {
  await invoke('db_update_cmd', {
    table: 'eval_results',
    query: { where: { id } },
    data,
  });
}

export async function listEvalResults(evalRunId: string): Promise<EvalResult[]> {
  return dbSelect<EvalResult>('eval_results', {
    where: { eval_run_id: evalRunId },
    orderBy: 'sort_order',
    orderDirection: 'asc',
  });
}
