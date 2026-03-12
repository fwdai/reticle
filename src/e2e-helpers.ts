import { dbDelete, dbSelect } from '@/lib/storage/db';

async function clearDatabase() {
  const tables = await dbSelect<{ name: string }>('sqlite_master', {
    where: { type: 'table' },
  });
  const userTables = tables
    .map((t) => t.name)
    .filter((name) => !name.startsWith('sqlite_'));
  await Promise.all(userTables.map((t) => dbDelete(t)));
}

(window as any).__e2e = {
  deleteAllScenarios: () => dbDelete('scenarios'),
  deleteAllAgents: () => dbDelete('agents'),
  clearDatabase,
};
