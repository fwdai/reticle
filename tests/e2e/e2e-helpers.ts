import { dbExec, dbInsert, dbSelect } from '@/lib/storage/db';
import { getOrCreateDefaultCollection } from '@/lib/storage/scenarios';

async function clearDatabase() {
  const tables = await dbSelect<{ name: string }>('sqlite_master', {
    where: { type: 'table' },
  });
  for (const { name } of tables.filter((t: { name: string }) => !t.name.startsWith('sqlite_'))) {
    await dbExec(`DELETE FROM ${name}`);
  }
}

(globalThis as any).__e2e = {
  clearDatabase,
  insert: (table: string, data: Record<string, unknown>) => dbInsert(table, data),
  getOrCreateDefaultCollection,
  exec: (sql: string) => dbExec(sql),
};
