import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  insertExecution,
  updateExecution,
  listExecutions,
  countExecutions,
  getLastExecutionForScenario,
  getExecutionById,
} from '@/lib/storage/executions';
import type { Execution } from '@/types';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbUpdate = vi.mocked(db.dbUpdate);
const mockDbCount = vi.mocked(db.dbCount);

beforeEach(() => vi.resetAllMocks());

const execution: Execution = {
  id: 'exec-1',
  type: 'scenario',
  status: 'succeeded',
  runnable_id: 'scenario-1',
  snapshot_json: '{}',
  started_at: 1000,
  ended_at: 2000,
};

// --- insertExecution ---

describe('insertExecution', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('exec-1');
    expect(await insertExecution(execution)).toBe('exec-1');
    expect(mockDbInsert).toHaveBeenCalledWith('executions', execution);
  });
});

// --- updateExecution ---

describe('updateExecution', () => {
  it('updates by id', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateExecution('exec-1', execution);
    expect(mockDbUpdate).toHaveBeenCalledWith('executions', { id: 'exec-1' }, execution);
  });
});

// --- listExecutions ---

describe('listExecutions', () => {
  beforeEach(() => mockDbSelect.mockResolvedValue([]));

  it('uses started_at desc ordering with no filters', async () => {
    await listExecutions();
    expect(mockDbSelect).toHaveBeenCalledWith('executions', {
      orderBy: 'started_at',
      orderDirection: 'desc',
    });
  });

  it('adds type to where clause', async () => {
    await listExecutions({ type: 'scenario' });
    expect(mockDbSelect).toHaveBeenCalledWith('executions', expect.objectContaining({
      where: { type: 'scenario' },
    }));
  });

  it('adds status to where clause', async () => {
    await listExecutions({ status: 'failed' });
    expect(mockDbSelect).toHaveBeenCalledWith('executions', expect.objectContaining({
      where: { status: 'failed' },
    }));
  });

  it('adds runnable_id to where clause', async () => {
    await listExecutions({ runnableId: 'scenario-1' });
    expect(mockDbSelect).toHaveBeenCalledWith('executions', expect.objectContaining({
      where: { runnable_id: 'scenario-1' },
    }));
  });

  it('combines multiple filters in where clause', async () => {
    await listExecutions({ type: 'scenario', status: 'failed' });
    expect(mockDbSelect).toHaveBeenCalledWith('executions', expect.objectContaining({
      where: { type: 'scenario', status: 'failed' },
    }));
  });

  it('omits where clause when no filters provided', async () => {
    await listExecutions({});
    expect(mockDbSelect).toHaveBeenCalledWith('executions',
      expect.not.objectContaining({ where: expect.anything() })
    );
  });

  it('includes offset when greater than 0', async () => {
    await listExecutions({ offset: 10 });
    expect(mockDbSelect).toHaveBeenCalledWith('executions', expect.objectContaining({ offset: 10 }));
  });

  it('omits offset when 0', async () => {
    await listExecutions({ offset: 0 });
    expect(mockDbSelect).toHaveBeenCalledWith('executions',
      expect.not.objectContaining({ offset: expect.anything() })
    );
  });

  it('includes limit when greater than 0', async () => {
    await listExecutions({ limit: 20 });
    expect(mockDbSelect).toHaveBeenCalledWith('executions', expect.objectContaining({ limit: 20 }));
  });

  it('omits limit when 0', async () => {
    await listExecutions({ limit: 0 });
    expect(mockDbSelect).toHaveBeenCalledWith('executions',
      expect.not.objectContaining({ limit: expect.anything() })
    );
  });

  it('omits limit when null', async () => {
    await listExecutions({ limit: null as never });
    expect(mockDbSelect).toHaveBeenCalledWith('executions',
      expect.not.objectContaining({ limit: expect.anything() })
    );
  });

  it('returns the rows', async () => {
    mockDbSelect.mockResolvedValue([execution]);
    expect(await listExecutions()).toEqual([execution]);
  });
});

// --- countExecutions ---

describe('countExecutions', () => {
  beforeEach(() => mockDbCount.mockResolvedValue(0));

  it('passes undefined where when called with no options', async () => {
    await countExecutions();
    expect(mockDbCount).toHaveBeenCalledWith('executions', undefined);
  });

  it('passes undefined where when options have no filters', async () => {
    await countExecutions({});
    expect(mockDbCount).toHaveBeenCalledWith('executions', undefined);
  });

  it('filters by type', async () => {
    await countExecutions({ type: 'scenario' });
    expect(mockDbCount).toHaveBeenCalledWith('executions', { type: 'scenario' });
  });

  it('filters by status', async () => {
    await countExecutions({ status: 'failed' });
    expect(mockDbCount).toHaveBeenCalledWith('executions', { status: 'failed' });
  });

  it('filters by type and status', async () => {
    await countExecutions({ type: 'scenario', status: 'failed' });
    expect(mockDbCount).toHaveBeenCalledWith('executions', { type: 'scenario', status: 'failed' });
  });

  it('returns the count', async () => {
    mockDbCount.mockResolvedValue(7);
    expect(await countExecutions()).toBe(7);
  });
});

// --- getLastExecutionForScenario ---

describe('getLastExecutionForScenario', () => {
  it('queries by scenario type and runnable_id, ordered by started_at desc', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    await getLastExecutionForScenario('scenario-1');
    expect(mockDbSelectOne).toHaveBeenCalledWith('executions', {
      where: { type: 'scenario', runnable_id: 'scenario-1' },
      orderBy: 'started_at',
      orderDirection: 'desc',
    });
  });

  it('returns the execution', async () => {
    mockDbSelectOne.mockResolvedValue(execution);
    expect(await getLastExecutionForScenario('scenario-1')).toEqual(execution);
  });

  it('returns null when not found', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    expect(await getLastExecutionForScenario('scenario-1')).toBeNull();
  });
});

// --- getExecutionById ---

describe('getExecutionById', () => {
  it('queries by id', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    await getExecutionById('exec-1');
    expect(mockDbSelectOne).toHaveBeenCalledWith('executions', { where: { id: 'exec-1' } });
  });

  it('returns the execution', async () => {
    mockDbSelectOne.mockResolvedValue(execution);
    expect(await getExecutionById('exec-1')).toEqual(execution);
  });

  it('returns null when not found', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    expect(await getExecutionById('exec-1')).toBeNull();
  });
});
