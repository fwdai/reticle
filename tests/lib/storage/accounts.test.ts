import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import { getOrCreateAccount, upsertAccount } from '@/lib/storage/accounts';

const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbUpsert = vi.mocked(db.dbUpsert);

beforeEach(() => vi.resetAllMocks());

// --- getOrCreateAccount ---

describe('getOrCreateAccount', () => {
  it('returns existing account without inserting', async () => {
    const account = { id: 'acc-1', first_name: 'Alex' };
    mockDbSelectOne.mockResolvedValue(account);

    const result = await getOrCreateAccount();

    expect(result).toEqual(account);
    expect(mockDbUpsert).not.toHaveBeenCalled();
  });

  it('inserts and returns the new account when none exists', async () => {
    const inserted = { id: 'new-id', first_name: null };
    mockDbSelectOne
      .mockResolvedValueOnce(null)      // no existing account
      .mockResolvedValueOnce(inserted); // re-fetch after insert
    mockDbUpsert.mockResolvedValue('new-id');

    const result = await getOrCreateAccount();

    expect(mockDbUpsert).toHaveBeenCalledWith('accounts', {}, {});
    expect(result).toEqual(inserted);
  });

  it('falls back to { id } when re-fetch returns null', async () => {
    mockDbSelectOne
      .mockResolvedValueOnce(null) // no existing account
      .mockResolvedValueOnce(null); // re-fetch also returns nothing
    mockDbUpsert.mockResolvedValue('new-id');

    const result = await getOrCreateAccount();

    expect(result).toEqual({ id: 'new-id' });
  });
});

// --- upsertAccount ---

describe('upsertAccount', () => {
  const payload = { first_name: 'Alex', last_name: 'Smith' };

  it('merges data onto existing account and returns it', async () => {
    const existing = { id: 'acc-1', first_name: 'Old', last_name: 'Name' };
    mockDbSelectOne.mockResolvedValue(existing);
    mockDbUpsert.mockResolvedValue('acc-1');

    const result = await upsertAccount(payload);

    expect(mockDbUpsert).toHaveBeenCalledWith('accounts', {}, payload);
    expect(result).toEqual({ ...existing, ...payload });
  });

  it('re-fetches and returns inserted account when none existed', async () => {
    const inserted = { id: 'new-id', first_name: 'Alex', last_name: 'Smith' };
    mockDbSelectOne
      .mockResolvedValueOnce(null)       // no existing account
      .mockResolvedValueOnce(inserted);  // re-fetch after insert
    mockDbUpsert.mockResolvedValue('new-id');

    const result = await upsertAccount(payload);

    expect(result).toEqual(inserted);
  });

  it('falls back to { id, ...data } when re-fetch returns null', async () => {
    mockDbSelectOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockDbUpsert.mockResolvedValue('new-id');

    const result = await upsertAccount(payload);

    expect(result).toEqual({ id: 'new-id', ...payload });
  });
});
