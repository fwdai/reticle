import { AgentRecord } from '@/types';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbDelete, dbUpsert } from './db';

// --- Agent Memories ---

export interface AgentMemory {
  id: string;
  agent_id: string;
  key: string;
  value: string;
  created_at: number;
  updated_at: number;
}

export async function listAgentMemories(agentId: string): Promise<AgentMemory[]> {
  return dbSelect<AgentMemory>('agent_memories', {
    where: { agent_id: agentId },
    orderBy: 'created_at',
    orderDirection: 'asc',
  });
}

export async function saveAgentMemory(agentId: string, key: string, value: string): Promise<void> {
  await dbUpsert(
    'agent_memories',
    { agent_id: agentId, key },
    { agent_id: agentId, key, value },
    { value }
  );
}

export async function deleteAgentMemory(id: string): Promise<void> {
  await dbDelete('agent_memories', { id });
}

export async function clearAgentMemories(agentId: string): Promise<void> {
  await dbDelete('agent_memories', { agent_id: agentId });
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
  return dbInsert('agents', data);
}

export async function updateAgent(id: string, data: Partial<AgentRecord>): Promise<void> {
  await dbUpdate('agents', { id }, data);
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
  const status: 'ready' | 'needs-config' = hasGoal && hasInstructions ? 'ready' : 'needs-config';
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
