import { EvalTestCase, EvalRun, EvalResult, EvalRunnableType } from '@/types';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbDelete } from './db';

// ── Eval test cases ────────────────────────────────────────────────────────────

export async function listEvalTestCases(
  runnableId: string,
  runnableType: EvalRunnableType
): Promise<EvalTestCase[]> {
  return dbSelect<EvalTestCase>('eval_test_cases', {
    where: { runnable_id: runnableId, runnable_type: runnableType },
    orderBy: 'sort_order',
    orderDirection: 'asc',
  });
}

export async function insertEvalTestCase(data: EvalTestCase): Promise<string> {
  return dbInsert('eval_test_cases', data);
}

export async function updateEvalTestCase(id: string, data: Partial<EvalTestCase>): Promise<void> {
  await dbUpdate('eval_test_cases', { id }, data);
}

export async function deleteEvalTestCase(id: string): Promise<void> {
  await dbDelete('eval_test_cases', { id });
}

/** Sync the test case list for a runnable: update existing, insert new, delete removed.
 *  IDs are stable across saves so eval_results.test_case_id foreign keys stay intact. */
export async function syncEvalTestCases(
  runnableId: string,
  runnableType: EvalRunnableType,
  cases: Array<{ id: string } & Pick<EvalTestCase, 'inputs_json' | 'assertions_json'>>
): Promise<void> {
  const existing = await listEvalTestCases(runnableId, runnableType);
  const existingIds = new Set(existing.map(c => c.id!));
  const incomingIds = new Set(cases.map(c => c.id));

  for (const id of existingIds) {
    if (!incomingIds.has(id)) await deleteEvalTestCase(id);
  }

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (existingIds.has(c.id)) {
      await updateEvalTestCase(c.id, { inputs_json: c.inputs_json, assertions_json: c.assertions_json, sort_order: i });
    } else {
      await insertEvalTestCase({ id: c.id, runnable_id: runnableId, runnable_type: runnableType, sort_order: i, inputs_json: c.inputs_json, assertions_json: c.assertions_json });
    }
  }
}

// ── Eval runs ──────────────────────────────────────────────────────────────────

export async function insertEvalRun(data: EvalRun): Promise<string> {
  return dbInsert('eval_runs', data);
}

export async function updateEvalRun(id: string, data: Partial<EvalRun>): Promise<void> {
  await dbUpdate('eval_runs', { id }, data);
}

export async function listEvalRuns(runnableId: string, runnableType: EvalRunnableType): Promise<EvalRun[]> {
  return dbSelect<EvalRun>('eval_runs', {
    where: { runnable_id: runnableId, runnable_type: runnableType },
    orderBy: 'created_at',
    orderDirection: 'desc',
  });
}

export async function getEvalRun(id: string): Promise<EvalRun | null> {
  return dbSelectOne<EvalRun>('eval_runs', { where: { id } });
}

// ── Eval results ───────────────────────────────────────────────────────────────

export async function insertEvalResult(data: EvalResult): Promise<string> {
  return dbInsert('eval_results', data);
}

export async function updateEvalResult(id: string, data: Partial<EvalResult>): Promise<void> {
  await dbUpdate('eval_results', { id }, data);
}

export async function listEvalResults(evalRunId: string): Promise<EvalResult[]> {
  return dbSelect<EvalResult>('eval_results', {
    where: { eval_run_id: evalRunId },
    orderBy: 'sort_order',
    orderDirection: 'asc',
  });
}
