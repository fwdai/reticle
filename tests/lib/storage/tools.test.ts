import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  linkTool,
  unlinkTool,
  getLinkedToolIds,
  insertTool,
  updateTool,
  unsharedTool,
  countToolsByScenarioId,
  listSharedToolsWithMeta,
  getToolMeta,
  insertGlobalTool,
  listSharedTools,
  listToolsForEntity,
  listToolsByScenarioId,
  deleteTool,
  deleteToolsByScenarioId,
  upsertToolsForScenario,
} from '@/lib/storage/tools';
import type { Tool } from '@/components/Tools/types';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbUpdate = vi.mocked(db.dbUpdate);
const mockDbCount = vi.mocked(db.dbCount);
const mockDbDelete = vi.mocked(db.dbDelete);

beforeEach(() => vi.resetAllMocks());

// --- helpers ---

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: 'tool-1',
    name: 'My Tool',
    description: 'Does stuff',
    parameters: [],
    mockResponse: '{}',
    mockMode: 'json',
    isShared: false,
    ...overrides,
  };
}

function makeDbRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'tool-1',
    name: 'My Tool',
    description: 'Does stuff',
    parameters_json: '[]',
    mock_response: '{}',
    mock_mode: 'json',
    is_global: 0,
    sort_order: 0,
    ...overrides,
  };
}

// --- linkTool ---

describe('linkTool', () => {
  it('inserts a tool_link row', async () => {
    mockDbInsert.mockResolvedValue('link-1');
    await linkTool('tool-1', 'scenario-1', 'scenario');
    expect(mockDbInsert).toHaveBeenCalledWith('tool_links', {
      tool_id: 'tool-1',
      toolable_id: 'scenario-1',
      toolable_type: 'scenario',
    });
  });

  it('silently ignores errors (e.g. UNIQUE violations)', async () => {
    mockDbInsert.mockRejectedValue(new Error('UNIQUE constraint failed'));
    await expect(linkTool('tool-1', 'scenario-1', 'scenario')).resolves.toBeUndefined();
  });
});

// --- unlinkTool ---

describe('unlinkTool', () => {
  it('deletes the tool_link by tool_id, toolable_id and toolable_type', async () => {
    mockDbDelete.mockResolvedValue(1);
    await unlinkTool('tool-1', 'scenario-1', 'scenario');
    expect(mockDbDelete).toHaveBeenCalledWith('tool_links', {
      tool_id: 'tool-1',
      toolable_id: 'scenario-1',
      toolable_type: 'scenario',
    });
  });
});

// --- getLinkedToolIds ---

describe('getLinkedToolIds', () => {
  it('queries tool_links by toolable_id and toolable_type', async () => {
    mockDbSelect.mockResolvedValue([]);
    await getLinkedToolIds('scenario-1', 'scenario');
    expect(mockDbSelect).toHaveBeenCalledWith('tool_links', {
      where: { toolable_id: 'scenario-1', toolable_type: 'scenario' },
    });
  });

  it('returns the tool_id values from links', async () => {
    mockDbSelect.mockResolvedValue([{ tool_id: 'tool-1' }, { tool_id: 'tool-2' }]);
    expect(await getLinkedToolIds('scenario-1', 'scenario')).toEqual(['tool-1', 'tool-2']);
  });

  it('returns empty array when no links', async () => {
    mockDbSelect.mockResolvedValue([]);
    expect(await getLinkedToolIds('scenario-1', 'scenario')).toEqual([]);
  });
});

// --- insertTool ---

describe('insertTool', () => {
  it('inserts the tool row then creates a link', async () => {
    mockDbInsert
      .mockResolvedValueOnce('tool-1') // insert tool
      .mockResolvedValueOnce('link-1'); // linkTool
    const id = await insertTool(makeTool(), 'scenario-1', 'scenario', 2);
    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'tools', expect.objectContaining({ sort_order: 2 }));
    expect(mockDbInsert).toHaveBeenNthCalledWith(2, 'tool_links', expect.objectContaining({
      tool_id: 'tool-1',
      toolable_id: 'scenario-1',
      toolable_type: 'scenario',
    }));
    expect(id).toBe('tool-1');
  });

  it('defaults sort order to 0', async () => {
    mockDbInsert.mockResolvedValue('tool-1');
    await insertTool(makeTool(), 'scenario-1', 'scenario');
    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'tools', expect.objectContaining({ sort_order: 0 }));
  });

  it('serializes tool fields to db row shape', async () => {
    mockDbInsert.mockResolvedValue('tool-1');
    const tool = makeTool({
      id: 'tool-1',
      name: 'Fetch',
      description: 'Fetches data',
      parameters: [{ id: 'p1', name: 'url', type: 'string', description: 'The URL', required: true }],
      mockResponse: '{"ok":true}',
      mockMode: 'json',
      isShared: false,
    });
    await insertTool(tool, 'scenario-1', 'scenario', 0);
    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'tools', {
      id: 'tool-1',
      name: 'Fetch',
      description: 'Fetches data',
      parameters_json: JSON.stringify(tool.parameters),
      mock_response: '{"ok":true}',
      mock_mode: 'json',
      code: null,
      is_enabled: 1,
      is_global: 0,
      sort_order: 0,
    });
  });

  it('sets is_global to 1 for shared tools', async () => {
    mockDbInsert.mockResolvedValue('tool-1');
    await insertTool(makeTool({ isShared: true }), 'scenario-1', 'scenario');
    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'tools', expect.objectContaining({ is_global: 1 }));
  });
});

// --- updateTool ---

describe('updateTool', () => {
  it('does not call dbUpdate when updates is empty', async () => {
    await updateTool('tool-1', {});
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('maps name', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { name: 'Renamed' });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { name: 'Renamed' });
  });

  it('maps description', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { description: 'New desc' });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { description: 'New desc' });
  });

  it('serializes parameters to parameters_json', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    const parameters = [{ id: 'p1', name: 'x', type: 'string' as const, description: '', required: false }];
    await updateTool('tool-1', { parameters });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, {
      parameters_json: JSON.stringify(parameters),
    });
  });

  it('maps mockResponse to mock_response', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { mockResponse: '{"x":1}' });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { mock_response: '{"x":1}' });
  });

  it('maps mockMode to mock_mode', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { mockMode: 'code' });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { mock_mode: 'code' });
  });

  it('maps code', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { code: 'return 42;' });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { code: 'return 42;' });
  });

  it('maps isShared: true to is_global: 1', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { isShared: true });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { is_global: 1 });
  });

  it('maps isShared: false to is_global: 0', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateTool('tool-1', { isShared: false });
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { is_global: 0 });
  });
});

// --- unsharedTool ---

describe('unsharedTool', () => {
  it('deletes all links, re-links to scenario, sets is_global=0', async () => {
    mockDbDelete.mockResolvedValue(2);
    mockDbInsert.mockResolvedValue('link-1');
    mockDbUpdate.mockResolvedValue(undefined);

    await unsharedTool('tool-1', 'scenario-1');

    expect(mockDbDelete).toHaveBeenCalledWith('tool_links', { tool_id: 'tool-1' });
    expect(mockDbInsert).toHaveBeenCalledWith('tool_links', expect.objectContaining({
      tool_id: 'tool-1',
      toolable_id: 'scenario-1',
      toolable_type: 'scenario',
    }));
    expect(mockDbUpdate).toHaveBeenCalledWith('tools', { id: 'tool-1' }, { is_global: 0 });
  });
});

// --- countToolsByScenarioId ---

describe('countToolsByScenarioId', () => {
  it('counts tool_links for scenario', async () => {
    mockDbCount.mockResolvedValue(3);
    const result = await countToolsByScenarioId('scenario-1');
    expect(mockDbCount).toHaveBeenCalledWith('tool_links', { toolable_id: 'scenario-1', toolable_type: 'scenario' });
    expect(result).toBe(3);
  });
});

// --- insertGlobalTool ---

describe('insertGlobalTool', () => {
  it('forces is_global to 1 regardless of tool.isShared', async () => {
    mockDbInsert.mockResolvedValue('tool-1');
    await insertGlobalTool(makeTool({ isShared: false }));
    expect(mockDbInsert).toHaveBeenCalledWith('tools', expect.objectContaining({ is_global: 1 }));
  });

  it('returns the new id', async () => {
    mockDbInsert.mockResolvedValue('tool-1');
    expect(await insertGlobalTool(makeTool())).toBe('tool-1');
  });
});

// --- listSharedTools ---

describe('listSharedTools', () => {
  it('queries global tools ordered by name asc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listSharedTools();
    expect(mockDbSelect).toHaveBeenCalledWith('tools', {
      where: { is_global: 1 },
      orderBy: 'name',
      orderDirection: 'asc',
    });
  });

  it('maps db rows to Tool shape', async () => {
    mockDbSelect.mockResolvedValue([makeDbRow({ is_global: 1 })]);
    const [tool] = await listSharedTools();
    expect(tool).toMatchObject({
      id: 'tool-1',
      name: 'My Tool',
      description: 'Does stuff',
      parameters: [],
      mockResponse: '{}',
      mockMode: 'json',
      isShared: true,
    });
  });

  it('sets isShared true for is_global=1 rows', async () => {
    mockDbSelect.mockResolvedValue([makeDbRow({ is_global: 1 })]);
    const [tool] = await listSharedTools();
    expect(tool.isShared).toBe(true);
  });
});

// --- listSharedToolsWithMeta ---

describe('listSharedToolsWithMeta', () => {
  it('skips link count query when there are no global tools', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listSharedToolsWithMeta();
    expect(mockDbSelect).toHaveBeenCalledTimes(1);
  });

  it('counts how many entities each tool is linked to', async () => {
    mockDbSelect
      .mockResolvedValueOnce([makeDbRow({ id: 'tool-1', is_global: 1 }), makeDbRow({ id: 'tool-2', is_global: 1 })])
      .mockResolvedValueOnce([{ tool_id: 'tool-1' }, { tool_id: 'tool-1' }, { tool_id: 'tool-2' }]);

    const result = await listSharedToolsWithMeta();
    expect(result.find(t => t.id === 'tool-1')?.usedBy).toBe(2);
    expect(result.find(t => t.id === 'tool-2')?.usedBy).toBe(1);
  });

  it('sets usedBy to 0 for tools with no links', async () => {
    mockDbSelect
      .mockResolvedValueOnce([makeDbRow({ id: 'tool-1', is_global: 1 })])
      .mockResolvedValueOnce([]);
    const [result] = await listSharedToolsWithMeta();
    expect(result.usedBy).toBe(0);
  });

  it('sets updatedAt from numeric updated_at field', async () => {
    mockDbSelect
      .mockResolvedValueOnce([makeDbRow({ id: 'tool-1', is_global: 1, updated_at: 9999 })])
      .mockResolvedValueOnce([]);
    const [result] = await listSharedToolsWithMeta();
    expect(result.updatedAt).toBe(9999);
  });

  it('sets updatedAt to null when updated_at is missing', async () => {
    mockDbSelect
      .mockResolvedValueOnce([makeDbRow({ id: 'tool-1', is_global: 1 })])
      .mockResolvedValueOnce([]);
    const [result] = await listSharedToolsWithMeta();
    expect(result.updatedAt).toBeNull();
  });
});

// --- getToolMeta ---

describe('getToolMeta', () => {
  it('returns updatedAt from numeric updated_at and link count', async () => {
    mockDbSelectOne.mockResolvedValue({ id: 'tool-1', updated_at: 5000 });
    mockDbSelect.mockResolvedValue([{ tool_id: 'tool-1' }, { tool_id: 'tool-1' }]);
    expect(await getToolMeta('tool-1')).toEqual({ updatedAt: 5000, usedBy: 2 });
  });

  it('returns updatedAt null when row is missing', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    mockDbSelect.mockResolvedValue([]);
    expect(await getToolMeta('tool-1')).toEqual({ updatedAt: null, usedBy: 0 });
  });

  it('returns updatedAt null when updated_at is not a number', async () => {
    mockDbSelectOne.mockResolvedValue({ id: 'tool-1', updated_at: 'bad' });
    mockDbSelect.mockResolvedValue([]);
    expect(await getToolMeta('tool-1')).toEqual({ updatedAt: null, usedBy: 0 });
  });
});

// --- listToolsForEntity ---

describe('listToolsForEntity', () => {
  it('returns empty array when entity has no links', async () => {
    mockDbSelect.mockResolvedValueOnce([]);
    expect(await listToolsForEntity('scenario-1', 'scenario')).toEqual([]);
    expect(mockDbSelect).toHaveBeenCalledTimes(1);
  });

  it('returns only tools matching linked ids', async () => {
    mockDbSelect
      .mockResolvedValueOnce([{ tool_id: 'tool-1' }])
      .mockResolvedValueOnce([makeDbRow({ id: 'tool-1' }), makeDbRow({ id: 'tool-2' })]);
    const result = await listToolsForEntity('scenario-1', 'scenario');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tool-1');
  });

  it('includes shared tools by default', async () => {
    mockDbSelect
      .mockResolvedValueOnce([{ tool_id: 'tool-1' }])
      .mockResolvedValueOnce([makeDbRow({ id: 'tool-1', is_global: 1 })]);
    const result = await listToolsForEntity('scenario-1', 'scenario');
    expect(result).toHaveLength(1);
  });

  it('excludes shared tools when excludeShared is true', async () => {
    mockDbSelect
      .mockResolvedValueOnce([{ tool_id: 'tool-1' }, { tool_id: 'tool-2' }])
      .mockResolvedValueOnce([
        makeDbRow({ id: 'tool-1', is_global: 0 }),
        makeDbRow({ id: 'tool-2', is_global: 1 }),
      ]);
    const result = await listToolsForEntity('scenario-1', 'scenario', { excludeShared: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tool-1');
  });
});

// --- listToolsByScenarioId ---

describe('listToolsByScenarioId', () => {
  it('delegates to listToolsForEntity with excludeShared: true', async () => {
    mockDbSelect
      .mockResolvedValueOnce([{ tool_id: 'tool-1' }, { tool_id: 'tool-2' }])
      .mockResolvedValueOnce([
        makeDbRow({ id: 'tool-1', is_global: 0 }),
        makeDbRow({ id: 'tool-2', is_global: 1 }),
      ]);
    const result = await listToolsByScenarioId('scenario-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('tool-1');
  });
});

// --- deleteTool ---

describe('deleteTool', () => {
  it('deletes by id', async () => {
    mockDbDelete.mockResolvedValue(1);
    await deleteTool('tool-1');
    expect(mockDbDelete).toHaveBeenCalledWith('tools', { id: 'tool-1' });
  });
});

// --- deleteToolsByScenarioId ---

describe('deleteToolsByScenarioId', () => {
  it('only deletes local (non-global) tools', async () => {
    mockDbSelect.mockResolvedValue([{ tool_id: 'tool-1' }, { tool_id: 'tool-2' }]);
    mockDbDelete.mockResolvedValue(1);

    await deleteToolsByScenarioId('scenario-1');

    expect(mockDbDelete).toHaveBeenCalledTimes(2);
    expect(mockDbDelete).toHaveBeenCalledWith('tools', { id: 'tool-1', is_global: 0 });
    expect(mockDbDelete).toHaveBeenCalledWith('tools', { id: 'tool-2', is_global: 0 });
  });

  it('does nothing when scenario has no linked tools', async () => {
    mockDbSelect.mockResolvedValue([]);
    await deleteToolsByScenarioId('scenario-1');
    expect(mockDbDelete).not.toHaveBeenCalled();
  });
});

// --- upsertToolsForScenario ---

describe('upsertToolsForScenario', () => {
  it('inserts tools that do not exist in the db', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    mockDbInsert.mockResolvedValue('tool-1');

    await upsertToolsForScenario([makeTool({ id: 'tool-1' })], 'scenario-1');

    expect(mockDbInsert).toHaveBeenCalledWith('tools', expect.objectContaining({ id: 'tool-1' }));
  });

  it('only links tools that already exist in the db', async () => {
    mockDbSelectOne.mockResolvedValue({ id: 'tool-1' });
    mockDbInsert.mockResolvedValue('link-1');

    await upsertToolsForScenario([makeTool({ id: 'tool-1' })], 'scenario-1');

    expect(mockDbInsert).toHaveBeenCalledTimes(1);
    expect(mockDbInsert).toHaveBeenCalledWith('tool_links', expect.objectContaining({
      tool_id: 'tool-1',
      toolable_id: 'scenario-1',
    }));
  });

  it('passes the index as sort order when inserting', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    mockDbInsert.mockResolvedValue('x');

    await upsertToolsForScenario(
      [makeTool({ id: 'tool-a' }), makeTool({ id: 'tool-b' })],
      'scenario-1'
    );

    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'tools', expect.objectContaining({ sort_order: 0 }));
    expect(mockDbInsert).toHaveBeenNthCalledWith(3, 'tools', expect.objectContaining({ sort_order: 1 }));
  });

  it('does nothing for an empty tools list', async () => {
    await upsertToolsForScenario([], 'scenario-1');
    expect(mockDbSelectOne).not.toHaveBeenCalled();
    expect(mockDbInsert).not.toHaveBeenCalled();
  });
});

// --- dbRowToTool mapping (tested via listSharedTools) ---

describe('dbRowToTool field mapping', () => {
  it('parses parameters_json into parameter objects', async () => {
    const params = [{ id: 'p1', name: 'url', type: 'string', description: 'The URL', required: true }];
    mockDbSelect.mockResolvedValue([makeDbRow({ parameters_json: JSON.stringify(params) })]);
    const [tool] = await listSharedTools();
    expect(tool.parameters).toEqual(params);
  });

  it('defaults parameter type to string for unknown types', async () => {
    const params = [{ id: 'p1', name: 'x', type: 'unknown', description: '', required: false }];
    mockDbSelect.mockResolvedValue([makeDbRow({ parameters_json: JSON.stringify(params) })]);
    const [tool] = await listSharedTools();
    expect(tool.parameters[0].type).toBe('string');
  });

  it('returns empty parameters for invalid parameters_json', async () => {
    mockDbSelect.mockResolvedValue([makeDbRow({ parameters_json: 'not-json' })]);
    const [tool] = await listSharedTools();
    expect(tool.parameters).toEqual([]);
  });

  it('defaults mockMode to json for invalid values', async () => {
    mockDbSelect.mockResolvedValue([makeDbRow({ mock_mode: 'invalid' })]);
    const [tool] = await listSharedTools();
    expect(tool.mockMode).toBe('json');
  });

  it('sets code to undefined when not a string', async () => {
    mockDbSelect.mockResolvedValue([makeDbRow({ code: null })]);
    const [tool] = await listSharedTools();
    expect(tool.code).toBeUndefined();
  });

  it('sets code when it is a string', async () => {
    mockDbSelect.mockResolvedValue([makeDbRow({ code: 'return 1;' })]);
    const [tool] = await listSharedTools();
    expect(tool.code).toBe('return 1;');
  });
});
