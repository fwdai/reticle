import { ToolLoopAgent, stepCountIs } from 'ai';
import { createModel } from '@/lib/gateway';
import { insertExecution, updateExecution } from '@/lib/storage';
import { TELEMETRY_EVENTS, trackEvent } from '@/lib/telemetry';
import type { ExecutionState } from '@/contexts/AgentContext';
import type { AgentRecord, Execution, ExecutionStep } from '@/types';

function ts(): string {
  return new Date().toISOString();
}

export async function runAgentAction(
  agentRecord: AgentRecord,
  taskInput: string,
  setExecution: (updater: (prev: ExecutionState) => ExecutionState) => void,
): Promise<void> {
  trackEvent(TELEMETRY_EVENTS.AGENT_RUN_STARTED, {
    agent_id: agentRecord.id,
    provider: agentRecord.provider,
    model: agentRecord.model,
  });

  setExecution(prev => ({ ...prev, status: 'running', steps: [] }));

  const started_at = Date.now();
  const snapshot_json = JSON.stringify(agentRecord);
  const input_json = JSON.stringify({ taskInput });

  const executionId = await insertExecution({
    type: 'agent',
    runnable_id: agentRecord.id,
    snapshot_json,
    input_json,
    status: 'running',
    started_at,
  });

  setExecution(prev => ({ ...prev, executionId }));

  const stepBuffer: ExecutionStep[] = [];
  let currentLoop = 0;
  let totalTokens = 0;
  let finalText = '';

  // Emit task_received immediately so the UI shows something before the first LLM round-trip
  stepBuffer.push({
    id: crypto.randomUUID(),
    type: 'task_input',
    label: 'Task',
    status: 'success',
    timestamp: ts(),
    content: taskInput,
  });
  setExecution(prev => ({ ...prev, steps: [...stepBuffer] }));

  try {
    const instructions =
      [agentRecord.agent_goal, agentRecord.system_instructions]
        .filter(Boolean)
        .join('\n\n') || undefined;

    // Create ToolLoopAgent directly so we can consume fullStream.
    // streamWithEvents uses experimental_transform which is a streamText-only option
    // and is silently ignored by ToolLoopAgent — fullStream is the correct way to get events.
    const agent = new ToolLoopAgent({
      id: agentRecord.id,
      model: createModel({ provider: agentRecord.provider, model: agentRecord.model }),
      instructions,
      maxRetries: 3,
      stopWhen: stepCountIs(agentRecord.max_iterations ?? 10),
      ...(agentRecord.timeout_seconds
        ? { timeout: { totalMs: agentRecord.timeout_seconds * 1000 } }
        : {}),
    });

    let pendingModelStepId: string | null = null;
    const pendingToolStepIds = new Map<string, string>(); // toolCallId → stepId
    let stepText = '';

    const result = await agent.stream({ prompt: taskInput });

    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case 'start-step': {
          currentLoop++;
          stepText = '';
          const id = crypto.randomUUID();
          pendingModelStepId = id;
          stepBuffer.push({
            id,
            type: 'model_call',
            label: agentRecord.model,
            status: 'running',
            loop: currentLoop,
            timestamp: ts(),
            content: '',
          });
          break;
        }

        case 'text-delta': {
          // Accumulate text for the current step
          stepText += (chunk as { text?: string }).text ?? '';
          break;
        }

        case 'tool-call': {
          // AI SDK v6 uses `args`, earlier used `input` — handle both
          const tc = chunk as { toolCallId?: string; toolName: string; args?: unknown; input?: unknown };
          const id = crypto.randomUUID();
          pendingToolStepIds.set(tc.toolCallId ?? tc.toolName, id);
          stepBuffer.push({
            id,
            type: 'tool_call',
            label: tc.toolName,
            status: 'running',
            loop: currentLoop,
            timestamp: ts(),
            content: JSON.stringify(tc.args ?? tc.input, null, 2),
          });
          break;
        }

        case 'tool-result': {
          // AI SDK v6 uses `result`, earlier used `output` — handle both
          const tr = chunk as { toolCallId?: string; toolName?: string; result?: unknown; output?: unknown };
          const key = tr.toolCallId ?? tr.toolName ?? '';
          const stepId = pendingToolStepIds.get(key);
          if (stepId) {
            const idx = stepBuffer.findIndex(s => s.id === stepId);
            if (idx !== -1) {
              stepBuffer[idx] = {
                ...stepBuffer[idx],
                status: 'success',
                content:
                  stepBuffer[idx].content +
                  '\n\n' +
                  JSON.stringify(tr.result ?? tr.output, null, 2),
              };
            }
            pendingToolStepIds.delete(key);
          }
          break;
        }

        case 'finish-step': {
          // Complete the pending model_call step with accumulated text + usage
          const fs = chunk as {
            usage?: {
              promptTokens?: number;
              completionTokens?: number;
              totalTokens?: number;
              inputTokens?: number;
              outputTokens?: number;
            };
          };
          const u = fs.usage;
          const stepTokens = u
            ? (u.totalTokens ??
                (u.promptTokens ?? u.inputTokens ?? 0) +
                  (u.completionTokens ?? u.outputTokens ?? 0))
            : 0;
          totalTokens += stepTokens;

          if (pendingModelStepId) {
            const idx = stepBuffer.findIndex(s => s.id === pendingModelStepId);
            if (idx !== -1) {
              stepBuffer[idx] = {
                ...stepBuffer[idx],
                status: 'success',
                content: stepText,
                tokens: stepTokens || undefined,
              };
            }
            pendingModelStepId = null;
          }
          break;
        }
      }

      setExecution(prev => ({ ...prev, steps: [...stepBuffer], tokens: totalTokens }));
    }

    // After fullStream is exhausted, result.text resolves to the complete final text
    try {
      finalText = await result.text;
    } catch {
      // Fallback: use the last completed model_call step's content
      finalText =
        [...stepBuffer].reverse().find(s => s.type === 'model_call' && s.content)?.content ?? '';
    }

    stepBuffer.push({
      id: crypto.randomUUID(),
      type: 'output',
      label: 'Final Response',
      status: 'success',
      timestamp: ts(),
      content: finalText,
    });

    const ended_at = Date.now();

    const finalExecution: Execution = {
      type: 'agent',
      runnable_id: agentRecord.id,
      snapshot_json,
      input_json,
      result_json: JSON.stringify({ text: finalText }),
      steps_json: JSON.stringify(stepBuffer),
      status: 'succeeded',
      started_at,
      ended_at,
      usage_json: JSON.stringify({ totalTokens }),
    };
    await updateExecution(executionId, finalExecution);

    setExecution(prev => ({ ...prev, status: 'success', steps: [...stepBuffer], tokens: totalTokens }));

    trackEvent(TELEMETRY_EVENTS.AGENT_RUN_SUCCEEDED, {
      agent_id: agentRecord.id,
      provider: agentRecord.provider,
      model: agentRecord.model,
      total_tokens: totalTokens,
      steps_count: stepBuffer.length,
    });
  } catch (error) {
    const ended_at = Date.now();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    const stepsWithError: ExecutionStep[] = stepBuffer.map(s =>
      s.status === 'running' ? { ...s, status: 'error' as const } : s,
    );
    stepsWithError.push({
      id: crypto.randomUUID(),
      type: 'error',
      label: 'Error',
      status: 'error',
      timestamp: ts(),
      content: errorMessage,
    });

    await updateExecution(executionId, {
      type: 'agent',
      runnable_id: agentRecord.id,
      snapshot_json,
      input_json,
      status: 'failed',
      started_at,
      ended_at,
      steps_json: JSON.stringify(stepsWithError),
      error_json: JSON.stringify({ message: errorMessage }),
    });

    setExecution(prev => ({ ...prev, status: 'error', steps: stepsWithError }));

    trackEvent(TELEMETRY_EVENTS.AGENT_RUN_FAILED, {
      agent_id: agentRecord.id,
      provider: agentRecord.provider,
      model: agentRecord.model,
      error_message: errorMessage,
    });
  }
}
