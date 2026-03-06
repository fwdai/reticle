import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@tauri-apps/api/core');

import { invoke } from '@tauri-apps/api/core';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbCount, dbDelete, dbUpsert } from '@/lib/storage/db';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.resetAllMocks();
});

// --- dbSelect ---

describe('dbSelect', () => {
  it('passes table and query to invoke', async () => {
    mockInvoke.mockResolvedValue([]);
    await dbSelect('executions', { where: { id: '1' } });
    expect(mockInvoke).toHaveBeenCalledWith('db_select_cmd', { table: 'executions', query: { where: { id: '1' } } });
  });

  it('defaults to empty query when none provided', async () => {
    mockInvoke.mockResolvedValue([]);
    await dbSelect('executions');
    expect(mockInvoke).toHaveBeenCalledWith('db_select_cmd', { table: 'executions', query: {} });
  });

  it('returns rows from invoke', async () => {
    mockInvoke.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    expect(await dbSelect('executions')).toEqual([{ id: '1' }, { id: '2' }]);
  });

  it('returns empty array when invoke returns null', async () => {
    mockInvoke.mockResolvedValue(null);
    expect(await dbSelect('executions')).toEqual([]);
  });

  it('returns empty array when invoke returns a non-array', async () => {
    mockInvoke.mockResolvedValue('unexpected');
    expect(await dbSelect('executions')).toEqual([]);
  });
});

// --- dbSelectOne ---

describe('dbSelectOne', () => {
  it('appends limit: 1 to query', async () => {
    mockInvoke.mockResolvedValue([]);
    await dbSelectOne('agents', { where: { id: '1' } });
    expect(mockInvoke).toHaveBeenCalledWith('db_select_cmd', {
      table: 'agents',
      query: { where: { id: '1' }, limit: 1 },
    });
  });

  it('returns the first row', async () => {
    mockInvoke.mockResolvedValue([{ id: 'abc' }, { id: 'def' }]);
    expect(await dbSelectOne('agents')).toEqual({ id: 'abc' });
  });

  it('returns null when no rows', async () => {
    mockInvoke.mockResolvedValue([]);
    expect(await dbSelectOne('agents')).toBeNull();
  });
});

// --- dbInsert ---

describe('dbInsert', () => {
  it('calls db_insert_cmd with table and data', async () => {
    mockInvoke.mockResolvedValue('new-id');
    await dbInsert('agents', { name: 'test' });
    expect(mockInvoke).toHaveBeenCalledWith('db_insert_cmd', { table: 'agents', data: { name: 'test' } });
  });

  it('returns the id from invoke', async () => {
    mockInvoke.mockResolvedValue('new-id');
    expect(await dbInsert('agents', { name: 'test' })).toBe('new-id');
  });
});

// --- dbUpdate ---

describe('dbUpdate', () => {
  it('calls db_update_cmd with table, where query and data', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await dbUpdate('agents', { id: '1' }, { name: 'updated' });
    expect(mockInvoke).toHaveBeenCalledWith('db_update_cmd', {
      table: 'agents',
      query: { where: { id: '1' } },
      data: { name: 'updated' },
    });
  });
});

// --- dbCount ---

describe('dbCount', () => {
  it('calls db_count_cmd with where query', async () => {
    mockInvoke.mockResolvedValue(5);
    await dbCount('executions', { status: 'failed' });
    expect(mockInvoke).toHaveBeenCalledWith('db_count_cmd', {
      table: 'executions',
      query: { where: { status: 'failed' } },
    });
  });

  it('omits where when not provided', async () => {
    mockInvoke.mockResolvedValue(3);
    await dbCount('executions');
    expect(mockInvoke).toHaveBeenCalledWith('db_count_cmd', { table: 'executions', query: {} });
  });

  it('returns the count', async () => {
    mockInvoke.mockResolvedValue(7);
    expect(await dbCount('executions')).toBe(7);
  });

  it('returns 0 when invoke returns a non-number', async () => {
    mockInvoke.mockResolvedValue(null);
    expect(await dbCount('executions')).toBe(0);
  });
});

// --- dbDelete ---

describe('dbDelete', () => {
  it('calls db_delete_cmd with where query', async () => {
    mockInvoke.mockResolvedValue(2);
    await dbDelete('executions', { status: 'failed' });
    expect(mockInvoke).toHaveBeenCalledWith('db_delete_cmd', {
      table: 'executions',
      query: { where: { status: 'failed' } },
    });
  });

  it('omits where when not provided', async () => {
    mockInvoke.mockResolvedValue(0);
    await dbDelete('executions');
    expect(mockInvoke).toHaveBeenCalledWith('db_delete_cmd', { table: 'executions', query: {} });
  });

  it('returns the deleted row count', async () => {
    mockInvoke.mockResolvedValue(3);
    expect(await dbDelete('executions')).toBe(3);
  });

  it('returns 0 when invoke returns a non-number', async () => {
    mockInvoke.mockResolvedValue(null);
    expect(await dbDelete('executions')).toBe(0);
  });
});

// --- dbUpsert ---

describe('dbUpsert', () => {
  it('inserts when row does not exist and returns new id', async () => {
    mockInvoke
      .mockResolvedValueOnce([])        // dbSelectOne → no existing row
      .mockResolvedValueOnce('new-id'); // dbInsert
    const id = await dbUpsert('settings', { key: 'x' }, { key: 'x', value: 'y' });
    expect(mockInvoke).toHaveBeenCalledWith('db_insert_cmd', expect.objectContaining({ table: 'settings' }));
    expect(id).toBe('new-id');
  });

  it('updates by id when row exists with an id', async () => {
    mockInvoke
      .mockResolvedValueOnce([{ id: 'existing-id' }]) // dbSelectOne
      .mockResolvedValueOnce(undefined);               // dbUpdate
    const id = await dbUpsert('settings', { key: 'x' }, { key: 'x', value: 'y' }, { value: 'y' });
    expect(mockInvoke).toHaveBeenCalledWith('db_update_cmd', expect.objectContaining({
      query: { where: { id: 'existing-id' } },
    }));
    expect(id).toBe('existing-id');
  });

  it('updates by where clause when existing row has no id', async () => {
    mockInvoke
      .mockResolvedValueOnce([{ key: 'x' }]) // dbSelectOne — row has no id field
      .mockResolvedValueOnce(undefined);      // dbUpdate
    await dbUpsert('settings', { key: 'x' }, { key: 'x', value: 'y' }, { value: 'y' });
    expect(mockInvoke).toHaveBeenCalledWith('db_update_cmd', expect.objectContaining({
      query: { where: { key: 'x' } },
    }));
  });

  it('uses insertData as updateData when updateData is omitted', async () => {
    mockInvoke
      .mockResolvedValueOnce([{ id: 'existing-id' }])
      .mockResolvedValueOnce(undefined);
    await dbUpsert('settings', { key: 'x' }, { key: 'x', value: 'y' });
    expect(mockInvoke).toHaveBeenCalledWith('db_update_cmd', expect.objectContaining({
      data: { key: 'x', value: 'y' },
    }));
  });
});
