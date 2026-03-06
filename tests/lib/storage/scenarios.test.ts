import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  listScenarios,
  insertScenario,
  updateScenario,
  findCollectionByName,
  insertCollection,
  getOrCreateDefaultCollection,
  listPromptTemplates,
  insertPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
} from '@/lib/storage/scenarios';
import type { Scenario, PromptTemplate } from '@/types';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbUpdate = vi.mocked(db.dbUpdate);
const mockDbDelete = vi.mocked(db.dbDelete);

beforeEach(() => vi.resetAllMocks());

// --- helpers ---

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario-1',
    collection_id: 'col-1',
    title: 'Test Scenario',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    system_prompt: '',
    user_prompt: 'Hello',
    params_json: '{}',
    version: 1,
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
  return { id: 'tpl-1', type: 'system', name: 'My Template', content: 'Hello', archived_at: null, ...overrides };
}

// --- listScenarios ---

describe('listScenarios', () => {
  it('selects all scenarios', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listScenarios();
    expect(mockDbSelect).toHaveBeenCalledWith('scenarios');
  });

  it('returns the rows', async () => {
    const rows = [makeScenario()];
    mockDbSelect.mockResolvedValue(rows);
    expect(await listScenarios()).toEqual(rows);
  });
});

// --- insertScenario ---

describe('insertScenario', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('scenario-1');
    expect(await insertScenario(makeScenario())).toBe('scenario-1');
  });

  it('defaults version to 1 when not provided', async () => {
    mockDbInsert.mockResolvedValue('scenario-1');
    await insertScenario(makeScenario({ version: undefined }));
    expect(mockDbInsert).toHaveBeenCalledWith('scenarios', expect.objectContaining({ version: 1 }));
  });

  it('preserves version when provided', async () => {
    mockDbInsert.mockResolvedValue('scenario-1');
    await insertScenario(makeScenario({ version: 3 }));
    expect(mockDbInsert).toHaveBeenCalledWith('scenarios', expect.objectContaining({ version: 3 }));
  });
});

// --- updateScenario ---

describe('updateScenario', () => {
  it('updates by id', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    const data = makeScenario({ title: 'Renamed' });
    await updateScenario('scenario-1', data);
    expect(mockDbUpdate).toHaveBeenCalledWith('scenarios', { id: 'scenario-1' }, data);
  });
});

// --- insertCollection ---

describe('insertCollection', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('col-1');
    expect(await insertCollection({ name: 'My Collection' })).toBe('col-1');
    expect(mockDbInsert).toHaveBeenCalledWith('collections', { name: 'My Collection' });
  });
});

// --- findCollectionByName ---

describe('findCollectionByName', () => {
  it('queries by name', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    await findCollectionByName('My Collection');
    expect(mockDbSelectOne).toHaveBeenCalledWith('collections', { where: { name: 'My Collection' } });
  });

  it('returns the collection when found', async () => {
    mockDbSelectOne.mockResolvedValue({ id: 'col-1', name: 'My Collection' });
    expect(await findCollectionByName('My Collection')).toEqual({ id: 'col-1', name: 'My Collection' });
  });

  it('returns null when not found', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    expect(await findCollectionByName('Missing')).toBeNull();
  });
});

// --- getOrCreateDefaultCollection ---

describe('getOrCreateDefaultCollection', () => {
  it('returns existing default collection id without inserting', async () => {
    mockDbSelectOne.mockResolvedValue({ id: 'col-1', name: 'Default Collection' });

    const id = await getOrCreateDefaultCollection();

    expect(id).toBe('col-1');
    expect(mockDbInsert).not.toHaveBeenCalled();
  });

  it('inserts default collection when none exists and returns new id', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    mockDbInsert.mockResolvedValue('new-col-id');

    const id = await getOrCreateDefaultCollection();

    expect(mockDbInsert).toHaveBeenCalledWith('collections', {
      name: 'Default Collection',
      description: 'Default collection for scenarios',
    });
    expect(id).toBe('new-col-id');
  });
});

// --- listPromptTemplates ---

describe('listPromptTemplates', () => {
  beforeEach(() => mockDbSelect.mockResolvedValue([]));

  it('queries ordered by updated_at desc', async () => {
    await listPromptTemplates();
    expect(mockDbSelect).toHaveBeenCalledWith('prompt_templates', { orderBy: 'updated_at', orderDirection: 'desc' });
  });

  it('excludes archived templates by default', async () => {
    mockDbSelect.mockResolvedValue([
      makeTemplate({ id: 'a', archived_at: null }),
      makeTemplate({ id: 'b', archived_at: 1234567890 }),
    ]);
    const result = await listPromptTemplates();
    expect(result.map(r => r.id)).toEqual(['a']);
  });

  it('excludes archived templates when archived is "exclude"', async () => {
    mockDbSelect.mockResolvedValue([
      makeTemplate({ id: 'a', archived_at: null }),
      makeTemplate({ id: 'b', archived_at: 1234567890 }),
    ]);
    const result = await listPromptTemplates({ archived: 'exclude' });
    expect(result.map(r => r.id)).toEqual(['a']);
  });

  it('returns only archived templates when archived is "only"', async () => {
    mockDbSelect.mockResolvedValue([
      makeTemplate({ id: 'a', archived_at: null }),
      makeTemplate({ id: 'b', archived_at: 1234567890 }),
    ]);
    const result = await listPromptTemplates({ archived: 'only' });
    expect(result.map(r => r.id)).toEqual(['b']);
  });

  it('returns all templates when archived is "all"', async () => {
    const templates = [
      makeTemplate({ id: 'a', archived_at: null }),
      makeTemplate({ id: 'b', archived_at: 1234567890 }),
    ];
    mockDbSelect.mockResolvedValue(templates);
    expect(await listPromptTemplates({ archived: 'all' })).toEqual(templates);
  });
});

// --- insertPromptTemplate ---

describe('insertPromptTemplate', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('tpl-1');
    const data = { type: 'user' as const, name: 'New', content: 'Hello' };
    expect(await insertPromptTemplate(data)).toBe('tpl-1');
    expect(mockDbInsert).toHaveBeenCalledWith('prompt_templates', data);
  });
});

// --- updatePromptTemplate ---

describe('updatePromptTemplate', () => {
  it('updates by id', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updatePromptTemplate('tpl-1', { name: 'Renamed' });
    expect(mockDbUpdate).toHaveBeenCalledWith('prompt_templates', { id: 'tpl-1' }, { name: 'Renamed' });
  });
});

// --- deletePromptTemplate ---

describe('deletePromptTemplate', () => {
  it('deletes by id', async () => {
    mockDbDelete.mockResolvedValue(1);
    await deletePromptTemplate('tpl-1');
    expect(mockDbDelete).toHaveBeenCalledWith('prompt_templates', { id: 'tpl-1' });
  });
});
