import type { HumanInputSubmitPayload } from '@/types';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

const pendingByExecutionId = new Map<string, Pending>();

export function waitForAgentHumanInput(executionId: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (pendingByExecutionId.has(executionId)) {
      reject(new Error('A human input prompt is already pending for this execution.'));
      return;
    }
    pendingByExecutionId.set(executionId, { resolve, reject });
  });
}

export function submitAgentHumanInput(
  executionId: string,
  payload: HumanInputSubmitPayload,
): boolean {
  const p = pendingByExecutionId.get(executionId);
  if (!p) return false;
  p.resolve(payload);
  pendingByExecutionId.delete(executionId);
  return true;
}

export function rejectPendingAgentHumanInput(executionId: string, reason: Error): void {
  const p = pendingByExecutionId.get(executionId);
  if (!p) return;
  p.reject(reason);
  pendingByExecutionId.delete(executionId);
}
