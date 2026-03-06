import { Collection, PromptTemplate, Scenario } from '@/types';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbDelete } from './db';

const DEFAULT_COLLECTION_NAME = 'Default Collection';

// --- Scenarios ---

export async function listScenarios(): Promise<Scenario[]> {
  return dbSelect<Scenario>('scenarios');
}

export async function insertScenario(data: Scenario): Promise<string> {
  // created_at and updated_at are now handled by the backend
  const row: Scenario = { ...data, version: data.version ?? 1 };
  return dbInsert('scenarios', row);
}

export async function updateScenario(id: string, data: Scenario): Promise<void> {
  // updated_at is now handled by the backend
  await dbUpdate('scenarios', { id }, data);
}

// --- Collections ---

export async function findCollectionByName(name: string): Promise<{ id: string; name: string } | null> {
  return dbSelectOne<{ id: string; name: string }>('collections', { where: { name } });
}

export async function insertCollection(data: Collection): Promise<string> {
  // created_at and updated_at are handled by the backend
  return dbInsert('collections', data);
}

export async function getOrCreateDefaultCollection(): Promise<string> {
  const existing = await findCollectionByName(DEFAULT_COLLECTION_NAME);
  if (existing) return existing.id;
  return insertCollection({
    name: DEFAULT_COLLECTION_NAME,
    description: 'Default collection for scenarios',
  });
}

// --- Prompt Templates ---

export type ListPromptTemplatesOptions = {
  /** 'exclude' (default): only non-archived; 'only': only archived; 'all': no filter */
  archived?: 'exclude' | 'only' | 'all';
};

export async function listPromptTemplates(options?: ListPromptTemplatesOptions): Promise<PromptTemplate[]> {
  const arr = await dbSelect<PromptTemplate>('prompt_templates', { orderBy: 'updated_at', orderDirection: 'desc' });
  const archived = options?.archived ?? 'exclude';
  if (archived === 'exclude') return arr.filter(r => r.archived_at == null);
  if (archived === 'only') return arr.filter(r => r.archived_at != null);
  return arr;
}

export async function insertPromptTemplate(
  data: Omit<PromptTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  return dbInsert('prompt_templates', data);
}

export async function updatePromptTemplate(id: string, data: Partial<PromptTemplate>): Promise<void> {
  await dbUpdate('prompt_templates', { id }, data);
}

export async function deletePromptTemplate(id: string): Promise<void> {
  await dbDelete('prompt_templates', { id });
}
