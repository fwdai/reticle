import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import { listEnvVariables, hasApiKeys, getSetting, setSetting } from '@/lib/storage/settings';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbUpsert = vi.mocked(db.dbUpsert);

beforeEach(() => vi.resetAllMocks());

// --- listEnvVariables ---

describe('listEnvVariables', () => {
  it('queries ordered by created_at asc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listEnvVariables();
    expect(mockDbSelect).toHaveBeenCalledWith('env_variables', { orderBy: 'created_at', orderDirection: 'asc' });
  });

  it('returns the rows', async () => {
    const rows = [{ id: '1', key: 'API_KEY', value: 'secret', is_secret: 1 }];
    mockDbSelect.mockResolvedValue(rows);
    expect(await listEnvVariables()).toEqual(rows);
  });
});

// --- hasApiKeys ---

describe('hasApiKeys', () => {
  it('returns true when at least one api key exists', async () => {
    mockDbSelect.mockResolvedValue([{ provider: 'anthropic' }]);
    expect(await hasApiKeys()).toBe(true);
  });

  it('returns false when no api keys exist', async () => {
    mockDbSelect.mockResolvedValue([]);
    expect(await hasApiKeys()).toBe(false);
  });
});

// --- getSetting ---

describe('getSetting', () => {
  it('queries settings by key', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    await getSetting('theme');
    expect(mockDbSelectOne).toHaveBeenCalledWith('settings', { where: { key: 'theme' } });
  });

  it('returns the value when found', async () => {
    mockDbSelectOne.mockResolvedValue({ key: 'theme', value: 'dark' });
    expect(await getSetting('theme')).toBe('dark');
  });

  it('returns null when not found', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    expect(await getSetting('theme')).toBeNull();
  });
});

// --- setSetting ---

describe('setSetting', () => {
  it('upserts with key as where, full row as insertData, value-only as updateData', async () => {
    mockDbUpsert.mockResolvedValue('1');
    await setSetting('theme', 'dark');
    expect(mockDbUpsert).toHaveBeenCalledWith(
      'settings',
      { key: 'theme' },
      { key: 'theme', value: 'dark' },
      { value: 'dark' }
    );
  });
});
