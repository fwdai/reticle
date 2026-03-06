import { TelemetryEvent } from '@/types';
import { dbSelect, dbInsert, dbCount, dbDelete } from './db';

export type InsertTelemetryEventInput = Omit<TelemetryEvent, 'id' | 'created_at' | 'updated_at'>;

export interface ListTelemetryEventsOptions {
  name?: string;
  trace_id?: string;
  offset?: number;
  limit?: number;
  orderDirection?: 'asc' | 'desc';
}

export async function insertTelemetryEvent(data: InsertTelemetryEventInput): Promise<string> {
  return dbInsert('telemetry_events', data);
}

export async function listTelemetryEvents(options?: ListTelemetryEventsOptions): Promise<TelemetryEvent[]> {
  const { name, trace_id, offset = 0, limit, orderDirection = 'desc' } = options ?? {};

  const where: Record<string, string> = {};
  if (name) where.name = name;
  if (trace_id) where.trace_id = trace_id;

  const query: Record<string, unknown> = { orderBy: 'occurred_at', orderDirection };
  if (Object.keys(where).length > 0) query.where = where;
  if (offset > 0) query.offset = offset;
  if (limit != null && limit > 0) query.limit = limit;

  return dbSelect<TelemetryEvent>('telemetry_events', query);
}

export async function countTelemetryEvents(
  where?: Partial<Pick<TelemetryEvent, 'name' | 'trace_id'>>
): Promise<number> {
  return dbCount('telemetry_events', where as Record<string, unknown> | undefined);
}

export async function deleteTelemetryEvents(
  where?: Partial<Pick<TelemetryEvent, 'id' | 'name' | 'trace_id'>>
): Promise<number> {
  return dbDelete('telemetry_events', where as Record<string, unknown> | undefined);
}
