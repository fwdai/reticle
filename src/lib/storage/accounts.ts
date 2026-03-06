import { Account } from '@/types';
import { dbSelectOne, dbUpsert } from './db';

export async function getOrCreateAccount(): Promise<Account> {
  const existing = await dbSelectOne<Account>('accounts');
  if (existing) return existing;

  const id = await dbUpsert('accounts', {}, {});
  const inserted = await dbSelectOne<Account>('accounts', { where: { id } });
  return inserted ?? { id };
}

/**
 * Upserts account: inserts if table is empty, updates if account exists.
 */
export async function upsertAccount(
  data: Partial<
    Pick<Account, 'first_name' | 'last_name' | 'avatar' | 'role' | 'use_case' | 'timezone' | 'usage_context'>
  >
): Promise<Account> {
  const existing = await dbSelectOne<Account>('accounts');
  const id = await dbUpsert('accounts', {}, data);
  if (existing?.id) return { ...existing, ...data };

  const inserted = await dbSelectOne<Account>('accounts', { where: { id } });
  return inserted ?? { id, ...data };
}
