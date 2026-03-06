import type { AttachedFile } from '@/contexts/StudioContext';
import { dbSelect, dbInsert, dbCount, dbDelete } from './db';

export async function insertAttachment(
  attachment: AttachedFile,
  scenarioId: string,
  sortOrder: number
): Promise<string> {
  return dbInsert('attachments', {
    id: attachment.id,
    scenario_id: scenarioId,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    path: attachment.path ?? null,
    sort_order: sortOrder,
  });
}

export async function countAttachmentsByScenarioId(scenarioId: string): Promise<number> {
  return dbCount('attachments', { scenario_id: scenarioId });
}

export async function listAttachmentsByScenarioId(scenarioId: string): Promise<AttachedFile[]> {
  const rows = await dbSelect<Record<string, unknown>>('attachments', {
    where: { scenario_id: scenarioId },
    orderBy: 'sort_order',
    orderDirection: 'asc',
  });
  return rows.map(row => ({
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    size: Number(row.size ?? 0),
    type: String(row.type ?? 'application/octet-stream'),
    path: typeof row.path === 'string' && row.path ? row.path : undefined,
  }));
}

export async function deleteAttachmentsByScenarioId(scenarioId: string): Promise<void> {
  await dbDelete('attachments', { scenario_id: scenarioId });
}

export async function deleteAttachmentById(id: string): Promise<void> {
  await dbDelete('attachments', { id });
}

/**
 * Replace all attachments for a scenario with the given list.
 */
export async function upsertAttachmentsForScenario(
  attachments: AttachedFile[],
  scenarioId: string
): Promise<void> {
  await deleteAttachmentsByScenarioId(scenarioId);
  for (let i = 0; i < attachments.length; i++) {
    await insertAttachment(attachments[i], scenarioId, i);
  }
}
