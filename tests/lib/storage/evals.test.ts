import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  listEvalTestCases,
  insertEvalTestCase,
  updateEvalTestCase,
  deleteEvalTestCase,
  syncEvalTestCases,
  insertEvalRun,
  updateEvalRun,
  listEvalRuns,
  getEvalRun,
  insertEvalResult,
  updateEvalResult,
  listEvalResults,
} from '@/lib/storage/evals';
import type { EvalTestCase, EvalRun, EvalResult } from '@/types';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbSelectOne = vi.mocked(db.dbSelectOne);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbUpdate = vi.mocked(db.dbUpdate);
const mockDbDelete = vi.mocked(db.dbDelete);

beforeEach(() => vi.resetAllMocks());

// --- helpers ---

function makeTestCase(overrides: Partial<EvalTestCase> = {}): EvalTestCase {
  return { id: 'tc-1', runnable_id: 'scenario-1', runnable_type: 'scenario', sort_order: 0, inputs_json: '{}', assertions_json: '[]', ...overrides };
}

function makeEvalRun(overrides: Partial<EvalRun> = {}): EvalRun {
  return {
    id: 'run-1',
    runnable_id: 'scenario-1',
    runnable_type: 'scenario',
    snapshot_json: '{}',
    status: 'completed',
    created_at: 0,
    ...overrides,
  };
}

function makeEvalResult(overrides: Partial<EvalResult> = {}): EvalResult {
  return {
    id: 'res-1',
    eval_run_id: 'run-1',
    test_case_id: 'tc-1',
    sort_order: 0,
    inputs_json: '{}',
    assertions_json: '[]',
    status: 'passed',
    passed: 1,
    ...overrides,
  };
}

// ── Eval test cases ────────────────────────────────────────────────────────────

describe('listEvalTestCases', () => {
  it('queries by runnable_id and runnable_type ordered by sort_order asc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listEvalTestCases('scenario-1', 'scenario');
    expect(mockDbSelect).toHaveBeenCalledWith('eval_test_cases', {
      where: { runnable_id: 'scenario-1', runnable_type: 'scenario' },
      orderBy: 'sort_order',
      orderDirection: 'asc',
    });
  });

  it('returns the rows', async () => {
    const rows = [makeTestCase()];
    mockDbSelect.mockResolvedValue(rows);
    expect(await listEvalTestCases('scenario-1', 'scenario')).toEqual(rows);
  });
});

describe('insertEvalTestCase', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('tc-1');
    const tc = makeTestCase();
    expect(await insertEvalTestCase(tc)).toBe('tc-1');
    expect(mockDbInsert).toHaveBeenCalledWith('eval_test_cases', tc);
  });
});

describe('updateEvalTestCase', () => {
  it('updates by id', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateEvalTestCase('tc-1', { inputs_json: '{"x":1}' });
    expect(mockDbUpdate).toHaveBeenCalledWith('eval_test_cases', { id: 'tc-1' }, { inputs_json: '{"x":1}' });
  });
});

describe('deleteEvalTestCase', () => {
  it('deletes by id', async () => {
    mockDbDelete.mockResolvedValue(1);
    await deleteEvalTestCase('tc-1');
    expect(mockDbDelete).toHaveBeenCalledWith('eval_test_cases', { id: 'tc-1' });
  });
});

// --- syncEvalTestCases ---

describe('syncEvalTestCases', () => {
  const runnableId = 'scenario-1';
  const runnableType = 'scenario' as const;

  it('inserts new cases with correct fields and sort order', async () => {
    mockDbSelect.mockResolvedValue([]); // no existing
    mockDbInsert.mockResolvedValue('tc-new');

    await syncEvalTestCases(runnableId, runnableType, [
      { id: 'tc-new', inputs_json: '{"x":1}', assertions_json: '[]' },
    ]);

    expect(mockDbInsert).toHaveBeenCalledWith('eval_test_cases', {
      id: 'tc-new',
      runnable_id: runnableId,
      runnable_type: runnableType,
      sort_order: 0,
      inputs_json: '{"x":1}',
      assertions_json: '[]',
    });
    expect(mockDbDelete).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('updates existing cases with new data and sort order', async () => {
    mockDbSelect.mockResolvedValue([makeTestCase({ id: 'tc-1' })]);
    mockDbUpdate.mockResolvedValue(undefined);

    await syncEvalTestCases(runnableId, runnableType, [
      { id: 'tc-1', inputs_json: '{"updated":true}', assertions_json: '[{"type":"contains"}]' },
    ]);

    expect(mockDbUpdate).toHaveBeenCalledWith('eval_test_cases', { id: 'tc-1' }, {
      inputs_json: '{"updated":true}',
      assertions_json: '[{"type":"contains"}]',
      sort_order: 0,
    });
    expect(mockDbInsert).not.toHaveBeenCalled();
    expect(mockDbDelete).not.toHaveBeenCalled();
  });

  it('deletes cases removed from the incoming list', async () => {
    mockDbSelect.mockResolvedValue([makeTestCase({ id: 'tc-old' })]);
    mockDbDelete.mockResolvedValue(1);

    await syncEvalTestCases(runnableId, runnableType, []);

    expect(mockDbDelete).toHaveBeenCalledWith('eval_test_cases', { id: 'tc-old' });
    expect(mockDbInsert).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('handles mixed delete, update, and insert in one sync', async () => {
    mockDbSelect.mockResolvedValue([
      makeTestCase({ id: 'tc-keep', sort_order: 0 }),
      makeTestCase({ id: 'tc-remove', sort_order: 1 }),
    ]);
    mockDbDelete.mockResolvedValue(1);
    mockDbUpdate.mockResolvedValue(undefined);
    mockDbInsert.mockResolvedValue('tc-new');

    await syncEvalTestCases(runnableId, runnableType, [
      { id: 'tc-keep', inputs_json: '{"a":1}', assertions_json: '[]' },
      { id: 'tc-new', inputs_json: '{"b":2}', assertions_json: '[]' },
    ]);

    expect(mockDbDelete).toHaveBeenCalledWith('eval_test_cases', { id: 'tc-remove' });
    expect(mockDbUpdate).toHaveBeenCalledWith('eval_test_cases', { id: 'tc-keep' }, expect.objectContaining({ sort_order: 0 }));
    expect(mockDbInsert).toHaveBeenCalledWith('eval_test_cases', expect.objectContaining({ id: 'tc-new', sort_order: 1 }));
  });

  it('assigns sort order by position in the incoming array', async () => {
    mockDbSelect.mockResolvedValue([]);
    mockDbInsert.mockResolvedValue('x');

    await syncEvalTestCases(runnableId, runnableType, [
      { id: 'tc-a', inputs_json: '{}', assertions_json: '[]' },
      { id: 'tc-b', inputs_json: '{}', assertions_json: '[]' },
      { id: 'tc-c', inputs_json: '{}', assertions_json: '[]' },
    ]);

    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'eval_test_cases', expect.objectContaining({ id: 'tc-a', sort_order: 0 }));
    expect(mockDbInsert).toHaveBeenNthCalledWith(2, 'eval_test_cases', expect.objectContaining({ id: 'tc-b', sort_order: 1 }));
    expect(mockDbInsert).toHaveBeenNthCalledWith(3, 'eval_test_cases', expect.objectContaining({ id: 'tc-c', sort_order: 2 }));
  });
});

// ── Eval runs ──────────────────────────────────────────────────────────────────

describe('insertEvalRun', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('run-1');
    const run = makeEvalRun();
    expect(await insertEvalRun(run)).toBe('run-1');
    expect(mockDbInsert).toHaveBeenCalledWith('eval_runs', run);
  });
});

describe('updateEvalRun', () => {
  it('updates by id', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateEvalRun('run-1', { status: 'failed' });
    expect(mockDbUpdate).toHaveBeenCalledWith('eval_runs', { id: 'run-1' }, { status: 'failed' });
  });
});

describe('listEvalRuns', () => {
  it('queries by runnable_id and runnable_type ordered by created_at desc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listEvalRuns('scenario-1', 'scenario');
    expect(mockDbSelect).toHaveBeenCalledWith('eval_runs', {
      where: { runnable_id: 'scenario-1', runnable_type: 'scenario' },
      orderBy: 'created_at',
      orderDirection: 'desc',
    });
  });
});

describe('getEvalRun', () => {
  it('queries by id and returns the run', async () => {
    const run = makeEvalRun();
    mockDbSelectOne.mockResolvedValue(run);
    expect(await getEvalRun('run-1')).toEqual(run);
    expect(mockDbSelectOne).toHaveBeenCalledWith('eval_runs', { where: { id: 'run-1' } });
  });

  it('returns null when not found', async () => {
    mockDbSelectOne.mockResolvedValue(null);
    expect(await getEvalRun('run-1')).toBeNull();
  });
});

// ── Eval results ───────────────────────────────────────────────────────────────

describe('insertEvalResult', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('res-1');
    const result = makeEvalResult();
    expect(await insertEvalResult(result)).toBe('res-1');
    expect(mockDbInsert).toHaveBeenCalledWith('eval_results', result);
  });
});

describe('updateEvalResult', () => {
  it('updates by id', async () => {
    mockDbUpdate.mockResolvedValue(undefined);
    await updateEvalResult('res-1', { passed: 0 });
    expect(mockDbUpdate).toHaveBeenCalledWith('eval_results', { id: 'res-1' }, { passed: 0 });
  });
});

describe('listEvalResults', () => {
  it('queries by eval_run_id ordered by sort_order asc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listEvalResults('run-1');
    expect(mockDbSelect).toHaveBeenCalledWith('eval_results', {
      where: { eval_run_id: 'run-1' },
      orderBy: 'sort_order',
      orderDirection: 'asc',
    });
  });
});
