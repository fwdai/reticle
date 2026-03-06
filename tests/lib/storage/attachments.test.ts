import { vi, describe, it, expect, beforeEach } from 'vitest';
vi.mock('@/lib/storage/db');

import * as db from '@/lib/storage/db';
import {
  insertAttachment,
  countAttachmentsByScenarioId,
  listAttachmentsByScenarioId,
  deleteAttachmentsByScenarioId,
  deleteAttachmentById,
  upsertAttachmentsForScenario,
} from '@/lib/storage/attachments';
import type { AttachedFile } from '@/contexts/StudioContext';

const mockDbSelect = vi.mocked(db.dbSelect);
const mockDbInsert = vi.mocked(db.dbInsert);
const mockDbCount = vi.mocked(db.dbCount);
const mockDbDelete = vi.mocked(db.dbDelete);

beforeEach(() => vi.resetAllMocks());

// --- helpers ---

function makeAttachment(overrides: Partial<AttachedFile> = {}): AttachedFile {
  return { id: 'file-1', name: 'test.txt', size: 100, type: 'text/plain', ...overrides };
}

// --- insertAttachment ---

describe('insertAttachment', () => {
  it('maps attachment fields to db row shape', async () => {
    mockDbInsert.mockResolvedValue('file-1');
    await insertAttachment(makeAttachment(), 'scenario-1', 2);
    expect(mockDbInsert).toHaveBeenCalledWith('attachments', {
      id: 'file-1',
      scenario_id: 'scenario-1',
      name: 'test.txt',
      size: 100,
      type: 'text/plain',
      path: null,
      sort_order: 2,
    });
  });

  it('includes path when present', async () => {
    mockDbInsert.mockResolvedValue('file-1');
    await insertAttachment(makeAttachment({ path: '/tmp/test.txt' }), 'scenario-1', 0);
    expect(mockDbInsert).toHaveBeenCalledWith('attachments', expect.objectContaining({ path: '/tmp/test.txt' }));
  });

  it('sets path to null when not provided', async () => {
    mockDbInsert.mockResolvedValue('file-1');
    await insertAttachment(makeAttachment({ path: undefined }), 'scenario-1', 0);
    expect(mockDbInsert).toHaveBeenCalledWith('attachments', expect.objectContaining({ path: null }));
  });

  it('returns the inserted id', async () => {
    mockDbInsert.mockResolvedValue('new-id');
    expect(await insertAttachment(makeAttachment(), 'scenario-1', 0)).toBe('new-id');
  });
});

// --- countAttachmentsByScenarioId ---

describe('countAttachmentsByScenarioId', () => {
  it('counts by scenario_id', async () => {
    mockDbCount.mockResolvedValue(3);
    const result = await countAttachmentsByScenarioId('scenario-1');
    expect(mockDbCount).toHaveBeenCalledWith('attachments', { scenario_id: 'scenario-1' });
    expect(result).toBe(3);
  });
});

// --- listAttachmentsByScenarioId ---

describe('listAttachmentsByScenarioId', () => {
  it('queries by scenario_id ordered by sort_order asc', async () => {
    mockDbSelect.mockResolvedValue([]);
    await listAttachmentsByScenarioId('scenario-1');
    expect(mockDbSelect).toHaveBeenCalledWith('attachments', {
      where: { scenario_id: 'scenario-1' },
      orderBy: 'sort_order',
      orderDirection: 'asc',
    });
  });

  it('maps db rows to AttachedFile shape', async () => {
    mockDbSelect.mockResolvedValue([
      { id: 'f1', name: 'photo.png', size: 2048, type: 'image/png', path: '/tmp/photo.png' },
    ]);
    const result = await listAttachmentsByScenarioId('scenario-1');
    expect(result).toEqual([{ id: 'f1', name: 'photo.png', size: 2048, type: 'image/png', path: '/tmp/photo.png' }]);
  });

  it('sets path to undefined when falsy', async () => {
    mockDbSelect.mockResolvedValue([
      { id: 'f1', name: 'doc.pdf', size: 512, type: 'application/pdf', path: '' },
    ]);
    const [result] = await listAttachmentsByScenarioId('scenario-1');
    expect(result.path).toBeUndefined();
  });

  it('sets path to undefined when null', async () => {
    mockDbSelect.mockResolvedValue([
      { id: 'f1', name: 'doc.pdf', size: 512, type: 'application/pdf', path: null },
    ]);
    const [result] = await listAttachmentsByScenarioId('scenario-1');
    expect(result.path).toBeUndefined();
  });

  it('uses defaults for missing fields', async () => {
    mockDbSelect.mockResolvedValue([{}]);
    const [result] = await listAttachmentsByScenarioId('scenario-1');
    expect(result).toEqual({ id: '', name: '', size: 0, type: 'application/octet-stream', path: undefined });
  });
});

// --- deleteAttachmentsByScenarioId ---

describe('deleteAttachmentsByScenarioId', () => {
  it('deletes by scenario_id', async () => {
    mockDbDelete.mockResolvedValue(2);
    await deleteAttachmentsByScenarioId('scenario-1');
    expect(mockDbDelete).toHaveBeenCalledWith('attachments', { scenario_id: 'scenario-1' });
  });
});

// --- deleteAttachmentById ---

describe('deleteAttachmentById', () => {
  it('deletes by id', async () => {
    mockDbDelete.mockResolvedValue(1);
    await deleteAttachmentById('file-1');
    expect(mockDbDelete).toHaveBeenCalledWith('attachments', { id: 'file-1' });
  });
});

// --- upsertAttachmentsForScenario ---

describe('upsertAttachmentsForScenario', () => {
  it('deletes existing attachments then inserts each with sort order', async () => {
    mockDbDelete.mockResolvedValue(2);
    mockDbInsert.mockResolvedValue('x');
    const attachments = [makeAttachment({ id: 'f1' }), makeAttachment({ id: 'f2' })];

    await upsertAttachmentsForScenario(attachments, 'scenario-1');

    expect(mockDbDelete).toHaveBeenCalledWith('attachments', { scenario_id: 'scenario-1' });
    expect(mockDbInsert).toHaveBeenCalledTimes(2);
    expect(mockDbInsert).toHaveBeenNthCalledWith(1, 'attachments', expect.objectContaining({ id: 'f1', sort_order: 0 }));
    expect(mockDbInsert).toHaveBeenNthCalledWith(2, 'attachments', expect.objectContaining({ id: 'f2', sort_order: 1 }));
  });

  it('only deletes when given an empty list', async () => {
    mockDbDelete.mockResolvedValue(3);
    await upsertAttachmentsForScenario([], 'scenario-1');
    expect(mockDbDelete).toHaveBeenCalledOnce();
    expect(mockDbInsert).not.toHaveBeenCalled();
  });
});
