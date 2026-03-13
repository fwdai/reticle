import { dbExec, dbSelect } from '@/lib/storage/db';

async function clearDatabase() {
  const tables = await dbSelect<{ name: string }>('sqlite_master', {
    where: { type: 'table' },
  });
  for (const { name } of tables.filter((t) => !t.name.startsWith('sqlite_'))) {
    await dbExec(`DELETE FROM ${name}`);
  }
}

(window as any).__e2e = {
  clearDatabase,
  exec: (sql: string) => dbExec(sql),
};
