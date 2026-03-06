import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  insertTelemetryEvent,
  listTelemetryEvents,
  countTelemetryEvents,
  deleteTelemetryEvents,
} from '@/lib/storage/telemetry';
import type { TelemetryEvent } from '@/types';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbCount = vi.mocked(db.dbCount);
const mockDbDelete = vi.mocked(db.dbDelete);

beforeEach(() => vi.resetAllMocks());

function makeEvent(overrides: Partial<TelemetryEvent> = {}): TelemetryEvent {
  return { id: 'evt-1', name: 'llm.call', attributes_json: '{}', occurred_at: 1000, ...overrides };
}

// --- insertTelemetryEvent ---

describe('insertTelemetryEvent', () => {
  it('inserts and returns the new id', async () => {
    mockDbInsert.mockResolvedValue('evt-1');
    const data = { name: 'llm.call', attributes_json: '{}', occurred_at: 1000 };
    expect(await insertTelemetryEvent(data)).toBe('evt-1');
    expect(mockDbInsert).toHaveBeenCalledWith('telemetry_events', data);
  });
});

// --- listTelemetryEvents ---

describe('listTelemetryEvents', () => {
  beforeEach(() => mockDbSelect.mockResolvedValue([]));

  it('uses occurred_at desc ordering with no filters', async () => {
    await listTelemetryEvents();
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', {
      orderBy: 'occurred_at',
      orderDirection: 'desc',
    });
  });

  it('filters by name', async () => {
    await listTelemetryEvents({ name: 'llm.call' });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', expect.objectContaining({
      where: { name: 'llm.call' },
    }));
  });

  it('filters by trace_id', async () => {
    await listTelemetryEvents({ trace_id: 'trace-1' });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', expect.objectContaining({
      where: { trace_id: 'trace-1' },
    }));
  });

  it('combines name and trace_id in where clause', async () => {
    await listTelemetryEvents({ name: 'llm.call', trace_id: 'trace-1' });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', expect.objectContaining({
      where: { name: 'llm.call', trace_id: 'trace-1' },
    }));
  });

  it('omits where clause when no filters provided', async () => {
    await listTelemetryEvents({});
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events',
      expect.not.objectContaining({ where: expect.anything() })
    );
  });

  it('includes offset when greater than 0', async () => {
    await listTelemetryEvents({ offset: 20 });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', expect.objectContaining({ offset: 20 }));
  });

  it('omits offset when 0', async () => {
    await listTelemetryEvents({ offset: 0 });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events',
      expect.not.objectContaining({ offset: expect.anything() })
    );
  });

  it('includes limit when greater than 0', async () => {
    await listTelemetryEvents({ limit: 50 });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', expect.objectContaining({ limit: 50 }));
  });

  it('omits limit when 0', async () => {
    await listTelemetryEvents({ limit: 0 });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events',
      expect.not.objectContaining({ limit: expect.anything() })
    );
  });

  it('uses asc orderDirection when specified', async () => {
    await listTelemetryEvents({ orderDirection: 'asc' });
    expect(mockDbSelect).toHaveBeenCalledWith('telemetry_events', expect.objectContaining({
      orderDirection: 'asc',
    }));
  });

  it('returns the rows', async () => {
    const rows = [makeEvent()];
    mockDbSelect.mockResolvedValue(rows);
    expect(await listTelemetryEvents()).toEqual(rows);
  });
});

// --- countTelemetryEvents ---

describe('countTelemetryEvents', () => {
  beforeEach(() => mockDbCount.mockResolvedValue(0));

  it('passes undefined when called with no args', async () => {
    await countTelemetryEvents();
    expect(mockDbCount).toHaveBeenCalledWith('telemetry_events', undefined);
  });

  it('passes where when name is provided', async () => {
    await countTelemetryEvents({ name: 'llm.call' });
    expect(mockDbCount).toHaveBeenCalledWith('telemetry_events', { name: 'llm.call' });
  });

  it('passes where when trace_id is provided', async () => {
    await countTelemetryEvents({ trace_id: 'trace-1' });
    expect(mockDbCount).toHaveBeenCalledWith('telemetry_events', { trace_id: 'trace-1' });
  });

  it('returns the count', async () => {
    mockDbCount.mockResolvedValue(42);
    expect(await countTelemetryEvents()).toBe(42);
  });
});

// --- deleteTelemetryEvents ---

describe('deleteTelemetryEvents', () => {
  beforeEach(() => mockDbDelete.mockResolvedValue(0));

  it('passes undefined when called with no args', async () => {
    await deleteTelemetryEvents();
    expect(mockDbDelete).toHaveBeenCalledWith('telemetry_events', undefined);
  });

  it('passes where when filtering by name', async () => {
    await deleteTelemetryEvents({ name: 'llm.call' });
    expect(mockDbDelete).toHaveBeenCalledWith('telemetry_events', { name: 'llm.call' });
  });

  it('passes where when filtering by trace_id', async () => {
    await deleteTelemetryEvents({ trace_id: 'trace-1' });
    expect(mockDbDelete).toHaveBeenCalledWith('telemetry_events', { trace_id: 'trace-1' });
  });

  it('passes where when filtering by id', async () => {
    await deleteTelemetryEvents({ id: 'evt-1' });
    expect(mockDbDelete).toHaveBeenCalledWith('telemetry_events', { id: 'evt-1' });
  });

  it('returns the deleted row count', async () => {
    mockDbDelete.mockResolvedValue(5);
    expect(await deleteTelemetryEvents({ name: 'llm.call' })).toBe(5);
  });
});
