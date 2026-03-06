import { dbSelect, dbSelectOne, dbUpsert } from './db';

export interface EnvVariable { id: string; key: string; value: string; is_secret: number; }

export async function listEnvVariables(): Promise<EnvVariable[]> {
  return dbSelect<EnvVariable>('env_variables', { orderBy: 'created_at', orderDirection: 'asc' });
}

/** Check if user has configured at least one API key */
export async function hasApiKeys(): Promise<boolean> {
  const rows = await dbSelect<{ provider: string }>('api_keys');
  return rows.length > 0;
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await dbSelectOne<{ key: string; value: string }>('settings', { where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await dbUpsert('settings', { key }, { key, value }, { value });
}
