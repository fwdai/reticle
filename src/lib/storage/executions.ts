import { Execution, ExecutionStatus, ExecutionType } from '@/types';
import { dbSelect, dbSelectOne, dbInsert, dbUpdate, dbCount } from './db';

export async function insertExecution(data: Execution): Promise<string> {
  // created_at and updated_at are now handled by the backend
  return dbInsert('executions', data);
}

export async function updateExecution(id: string, data: Partial<Execution>): Promise<void> {
  // updated_at is now handled by the backend
  await dbUpdate('executions', { id }, data);
}

export interface ListExecutionsOptions {
  offset?: number;
  limit?: number;
  type?: ExecutionType;
  status?: ExecutionStatus;
  runnableId?: string;
}

export async function listExecutions(options?: ListExecutionsOptions): Promise<Execution[]> {
  const { offset = 0, limit, type, status, runnableId } = options ?? {};

  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(runnableId && { runnable_id: runnableId }),
  };

  return dbSelect<Execution>('executions', {
    orderBy: 'started_at',
    orderDirection: 'desc',
    ...(offset > 0 && { offset }),
    ...(limit != null && limit > 0 && { limit }),
    ...(Object.keys(where).length > 0 && { where }),
  });
}

export interface CountExecutionsOptions {
  type?: ExecutionType;
  status?: ExecutionStatus;
}

export async function countExecutions(options?: CountExecutionsOptions): Promise<number> {
  const where = {
    ...(options?.type && { type: options.type }),
    ...(options?.status && { status: options.status }),
  };
  return dbCount('executions', Object.keys(where).length > 0 ? where : undefined);
}

export async function getLastExecutionForScenario(scenarioId: string): Promise<Execution | null> {
  return dbSelectOne<Execution>('executions', {
    where: { type: 'scenario', runnable_id: scenarioId },
    orderBy: 'started_at',
    orderDirection: 'desc',
  });
}

export async function getExecutionById(id: string): Promise<Execution | null> {
  return dbSelectOne<Execution>('executions', { where: { id } });
}
