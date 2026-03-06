import type { Tool, ToolParameter } from '@/components/Tools/types';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbCount, dbDelete } from './db';

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
      type: ['string', 'number', 'boolean', 'object', 'array'].includes(String(p.type))
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
    mockMode: row.mock_mode === 'code' || row.mock_mode === 'json' ? row.mock_mode : 'json',
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
    await dbInsert('tool_links', { tool_id: toolId, toolable_id: toolableId, toolable_type: toolableType });
  } catch {
    // Ignore UNIQUE constraint violations (already linked)
  }
}

export async function unlinkTool(
  toolId: string,
  toolableId: string,
  toolableType: 'scenario' | 'agent'
): Promise<void> {
  await dbDelete('tool_links', { tool_id: toolId, toolable_id: toolableId, toolable_type: toolableType });
}

export async function getLinkedToolIds(
  toolableId: string,
  toolableType: 'scenario' | 'agent'
): Promise<string[]> {
  const links = await dbSelect<{ tool_id: string }>('tool_links', {
    where: { toolable_id: toolableId, toolable_type: toolableType },
  });
  return links.map(l => l.tool_id);
}

export async function insertTool(
  tool: Tool,
  toolableId: string,
  toolableType: 'scenario' | 'agent',
  sortOrder = 0
): Promise<string> {
  const toolId = await dbInsert('tools', toolToDbRow(tool, sortOrder));
  await linkTool(toolId, toolableId, toolableType);
  return toolId;
}

export async function updateTool(id: string, updates: Partial<Tool>): Promise<void> {
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.parameters !== undefined) data.parameters_json = JSON.stringify(updates.parameters);
  if (updates.mockResponse !== undefined) data.mock_response = updates.mockResponse;
  if (updates.mockMode !== undefined) data.mock_mode = updates.mockMode;
  if (updates.code !== undefined) data.code = updates.code;
  if (updates.isShared !== undefined) data.is_global = updates.isShared ? 1 : 0;
  if (Object.keys(data).length === 0) return;
  await dbUpdate('tools', { id }, data);
}

/** Set a tool back to local: delete all its links, re-link to given entity only, set is_global=0 */
export async function unsharedTool(toolId: string, scenarioId: string): Promise<void> {
  await dbDelete('tool_links', { tool_id: toolId });
  await linkTool(toolId, scenarioId, 'scenario');
  await dbUpdate('tools', { id: toolId }, { is_global: 0 });
}

export async function countToolsByScenarioId(scenarioId: string): Promise<number> {
  return dbCount('tool_links', { toolable_id: scenarioId, toolable_type: 'scenario' });
}

export interface ToolMeta {
  updatedAt: number | null;
  usedBy: number;
}

export async function listSharedToolsWithMeta(): Promise<(Tool & ToolMeta)[]> {
  const tools = await dbSelect<Record<string, unknown>>('tools', {
    where: { is_global: 1 },
    orderBy: 'name',
    orderDirection: 'asc',
  });
  const toolIds = tools.map(r => r.id as string);

  const linkCounts: Record<string, number> = {};
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
  return { updatedAt, usedBy: links.length };
}

export async function insertGlobalTool(tool: Tool): Promise<string> {
  return dbInsert('tools', toolToDbRow({ ...tool, isShared: true }));
}

export async function listSharedTools(): Promise<Tool[]> {
  const rows = await dbSelect<Record<string, unknown>>('tools', {
    where: { is_global: 1 },
    orderBy: 'name',
    orderDirection: 'asc',
  });
  return rows.map(dbRowToTool);
}

export async function listToolsForEntity(
  toolableId: string,
  toolableType: 'scenario' | 'agent',
  options: { excludeShared?: boolean } = {}
): Promise<Tool[]> {
  const links = await dbSelect<{ tool_id: string }>('tool_links', {
    where: { toolable_id: toolableId, toolable_type: toolableType },
  });
  const toolIds = links.map(l => l.tool_id);
  if (toolIds.length === 0) return [];

  const allRows = await dbSelect<Record<string, unknown>>('tools', { orderBy: 'sort_order', orderDirection: 'asc' });
  return allRows
    .filter(r => toolIds.includes(r.id as string) && (!options.excludeShared || r.is_global === 0))
    .map(dbRowToTool);
}

export async function listToolsByScenarioId(scenarioId: string): Promise<Tool[]> {
  return listToolsForEntity(scenarioId, 'scenario', { excludeShared: true });
}

export async function deleteTool(id: string): Promise<void> {
  await dbDelete('tools', { id });
}

export async function deleteToolsByScenarioId(scenarioId: string): Promise<void> {
  const links = await dbSelect<{ tool_id: string }>('tool_links', {
    where: { toolable_id: scenarioId, toolable_type: 'scenario' },
  });
  // Delete local (non-global) tools only — ON DELETE CASCADE removes their tool_links rows.
  // Global tools (is_global=1) are left intact; their links to this scenario are preserved.
  for (const link of links) {
    await dbDelete('tools', { id: link.tool_id, is_global: 0 });
  }
}

export async function upsertToolsForScenario(tools: Tool[], scenarioId: string): Promise<void> {
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
