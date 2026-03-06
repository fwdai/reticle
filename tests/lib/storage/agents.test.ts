import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  listAgentMemories,
  saveAgentMemory,
  deleteAgentMemory,
  clearAgentMemories,
  listAgents,
  getAgentById,
  insertAgent,
  updateAgent,
  agentRecordToListAgent,
} from '@/lib/storage/agents';
import type { AgentRecord } from '@/types';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbUpdate = vi.mocked(db.dbUpdate);
const mockDbDelete = vi.mocked(db.dbDelete);
const mockDbUpsert = vi.mocked(db.dbUpsert);

beforeEach(() => vi.resetAllMocks());

// --- helpers ---

function makeAgent(overrides: Partial<AgentRecord> = {}): AgentRecord {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    description: 'A test agent',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    params_json: '{}',
    agent_goal: 'Do things',
    system_instructions: 'Be helpful',
    tools_json: '[]',
    max_iterations: 10,
    timeout_seconds: 60,
    retry_policy: '{}',
    tool_call_strategy: 'auto',
    memory_enabled: 0,
    memory_source: 'none',
    archived_at: null,
    created_at: 0,
    updated_at: 0,
    ...overrides,
  };
}

// --- listAgentMemories ---

describe('listAgentMemories', () => {
  it('queries by agent_id ordered by created_at asc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listAgentMemories('agent-1');
    expect(mockDbSelect).toHaveBeenCalledWith('agent_memories', {
      where: { agent_id: 'agent-1' },
      orderBy: 'created_at',
      orderDirection: 'asc',
    });
  });

  it('returns the rows', async () => {
    const rows = [{ id: 'm1', agent_id: 'agent-1', key: 'k', value: 'v', created_at: 0, updated_at: 0 }];
    mockDbSelect.mockResolvedValue(rows);
    expect(await listAgentMemories('agent-1')).toEqual(rows);
  });
});

// --- saveAgentMemory ---

describe('saveAgentMemory', () => {
  it('upserts with correct where, insertData, updateData', async () => {
    mockDbUpsert.mockResolvedValue('m1');
    await saveAgentMemory('agent-1', 'mykey', 'myvalue');
    expect(mockDbUpsert).toHaveBeenCalledWith(
      'agent_memories',
      { agent_id: 'agent-1', key: 'mykey' },
      { agent_id: 'agent-1', key: 'mykey', value: 'myvalue' },
      { value: 'myvalue' }
    );
  });
});

// --- deleteAgentMemory ---

describe('deleteAgentMemory', () => {
  it('deletes by id', async () => {
    mockDbDelete.mockResolvedValue(1);
    await deleteAgentMemory('m1');
    expect(mockDbDelete).toHaveBeenCalledWith('agent_memories', { id: 'm1' });
  });
});

// --- clearAgentMemories ---

describe('clearAgentMemories', () => {
  it('deletes all memories for the agent', async () => {
    mockDbDelete.mockResolvedValue(3);
    await clearAgentMemories('agent-1');
    expect(mockDbDelete).toHaveBeenCalledWith('agent_memories', { agent_id: 'agent-1' });
  });
});

// --- listAgents ---

describe('listAgents', () => {
  it('queries ordered by updated_at desc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listAgents();
    expect(mockDbSelect).toHaveBeenCalledWith('agents', { orderBy: 'updated_at', orderDirection: 'desc' });
  });

  it('filters out archived agents', async () => {
    const active = makeAgent({ id: 'a1', archived_at: null });
    const archived = makeAgent({ id: 'a2', archived_at: 1234567890 });
    mockDbSelect.mockResolvedValue([active, archived]);
    expect(await listAgents()).toEqual([active]);
  });

  it('returns all agents when none are archived', async () => {
    const agents = [makeAgent({ id: 'a1' }), makeAgent({ id: 'a2' })];
    mockDbSelect.mockResolvedValue(agents);
    expect(await listAgents()).toEqual(agents);
  });
});

// --- getAgentById ---

describe('getAgentById', () => {
  it('queries by id', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    await getAgentById('agent-1');
    expect(mockDbSelectOne).toHaveBeenCalledWith('agents', { where: { id: 'agent-1' } });
  });

  it('returns the agent', async () => {
    const agent = makeAgent();
    mockDbSelectOne.mockResolvedValue(agent);
    expect(await getAgentById('agent-1')).toEqual(agent);
  });

  it('returns null when not found', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    expect(await getAgentById('agent-1')).toBeNull();
  });
});

// --- insertAgent ---

describe('insertAgent', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('new-id');
    const data = {
      name: 'New',
      description: '',
      agent_goal: '',
      system_instructions: '',
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      params_json: '{}',
      tools_json: '[]',
      max_iterations: 10,
      timeout_seconds: 60,
      retry_policy: '{}',
      tool_call_strategy: 'auto',
      memory_enabled: 0,
      memory_source: 'none',
    };
    expect(await insertAgent(data)).toBe('new-id');
    expect(mockDbInsert).toHaveBeenCalledWith('agents', data);
  });
});

// --- updateAgent ---

describe('updateAgent', () => {
  it('updates by id with partial data', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateAgent('agent-1', { name: 'Renamed' });
    expect(mockDbUpdate).toHaveBeenCalledWith('agents', { id: 'agent-1' }, { name: 'Renamed' });
  });
});

// --- agentRecordToListAgent ---

describe('agentRecordToListAgent', () => {
  it('is ready when agent_goal and system_instructions are set', () => {
    expect(agentRecordToListAgent(makeAgent()).status).toBe('ready');
  });

  it('is needs-config when agent_goal is missing', () => {
    expect(agentRecordToListAgent(makeAgent({ agent_goal: '' })).status).toBe('needs-config');
  });

  it('is needs-config when system_instructions is missing', () => {
    expect(agentRecordToListAgent(makeAgent({ system_instructions: '' })).status).toBe('needs-config');
  });

  it('uses agent_goal as description when present', () => {
    const result = agentRecordToListAgent(makeAgent({ agent_goal: 'My goal', description: 'Other' }));
    expect(result.description).toBe('My goal');
  });

  it('falls back to description when agent_goal is empty', () => {
    const result = agentRecordToListAgent(makeAgent({ agent_goal: '', description: 'Fallback' }));
    expect(result.description).toBe('Fallback');
  });

  it('counts tools from tools_json', () => {
    const tools = JSON.stringify([{ id: '1' }, { id: '2' }]);
    expect(agentRecordToListAgent(makeAgent({ tools_json: tools })).toolsCount).toBe(2);
  });

  it('returns 0 toolsCount for empty tools_json', () => {
    expect(agentRecordToListAgent(makeAgent({ tools_json: '[]' })).toolsCount).toBe(0);
  });

  it('returns 0 toolsCount for invalid tools_json', () => {
    expect(agentRecordToListAgent(makeAgent({ tools_json: 'not-json' })).toolsCount).toBe(0);
  });

  it('sets memoryEnabled from memory_enabled === 1', () => {
    expect(agentRecordToListAgent(makeAgent({ memory_enabled: 1 })).memoryEnabled).toBe(true);
    expect(agentRecordToListAgent(makeAgent({ memory_enabled: 0 })).memoryEnabled).toBe(false);
  });

  it('always sets starred to false', () => {
    expect(agentRecordToListAgent(makeAgent()).starred).toBe(false);
  });
});
