import { invoke } from '@tauri-apps/api/core';

export async function dbSelect<T>(table: string, query: Record<string, unknown> = {}): Promise<T[]> {
  const rows = await invoke<T[]>('db_select_cmd', { table, query });
  return Array.isArray(rows) ? rows : [];
}

export async function dbSelectOne<T>(table: string, query: Record<string, unknown> = {}): Promise<T | null> {
  const rows = await dbSelect<T>(table, { ...query, limit: 1 });
  return rows[0] ?? null;
}

export async function dbInsert(table: string, data: object): Promise<string> {
  return invoke<string>('db_insert_cmd', { table, data });
}

export async function dbUpdate(table: string, where: Record<string, unknown>, data: object): Promise<void> {
  await invoke('db_update_cmd', { table, query: { where }, data });
}

export async function dbCount(table: string, where?: Record<string, unknown>): Promise<number> {
  const query = where != null ? { where } : {};
  const count = await invoke<number>('db_count_cmd', { table, query });
  return typeof count === 'number' ? count : 0;
}

export async function dbDelete(table: string, where?: Record<string, unknown>): Promise<number> {
  const query = where != null ? { where } : {};
  const deleted = await invoke<number>('db_delete_cmd', { table, query });
  return typeof deleted === 'number' ? deleted : 0;
}

export async function dbUpsert(
  table: string,
  where: Record<string, unknown>,
  insertData: Record<string, unknown>,
  updateData: Record<string, unknown> = insertData
): Promise<string> {
  const existing = await dbSelectOne<{ id?: string }>(table, { where });
  if (existing) {
    const updateWhere = existing.id != null ? { id: existing.id } : where;
    await dbUpdate(table, updateWhere, updateData);
    return existing.id ?? '';
  }
  return dbInsert(table, insertData);
}
