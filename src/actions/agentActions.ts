import { streamText, stepCountIs, tool } from 'ai';
import { jsonSchema } from 'ai';
import { createModel } from '@/lib/gateway';
import { toolConfigToAiSdkTools } from '@/lib/gateway/helpers';
import { insertExecution, updateExecution, listToolsForEntity, listEnvVariables, listAgentMemories, saveAgentMemory } from '@/lib/storage';
import { TELEMETRY_EVENTS, trackEvent } from '@/lib/telemetry';
import { toast } from 'sonner';
import type { ExecutionState } from '@/contexts/AgentContext';
import type { AgentRecord, Execution, ExecutionStep } from '@/types';
import { substituteVariables } from '@/lib/helpers/substituteVariables';
import { formatDuration } from '@/lib/helpers/time';

function ts(): string {
  return new Date().toISOString();
}

export async function runAgentAction(
  agentRecord: AgentRecord,
  taskInput: string,
  setExecution: (updater: (prev: ExecutionState) => ExecutionState) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  if (!agentRecord.provider || !agentRecord.model) {
    toast.error('No model selected', { description: 'Choose a provider and model for this agent before running.' });
    return;
  }

  trackEvent(TELEMETRY_EVENTS.AGENT_RUN_STARTED, {
    agent_id: agentRecord.id,
    provider: agentRecord.provider,
    model: agentRecord.model,
  });

  setExecution(prev => ({
    ...prev,
    status: 'running',
    steps: [],
    provider: agentRecord.provider,
    model: agentRecord.model,
  }));

  const started_at = Date.now();

  const rawEnvVars = await listEnvVariables();
  const envVars = rawEnvVars.map(v => ({ id: 0, key: v.key, value: v.value }));
  const envVarsMap = Object.fromEntries(rawEnvVars.map(v => [v.key, v.value]));

  const rawInstructions =
    [agentRecord.agent_goal, agentRecord.system_instructions]
      .filter(Boolean)
      .join('\n\n') || undefined;
  const substitutedInstructions = rawInstructions
    ? substituteVariables(rawInstructions, envVars) || undefined
    : undefined;

  const memoryEnabled = agentRecord.memory_enabled === 1 && agentRecord.memory_source === 'local';
  const memories = memoryEnabled ? await listAgentMemories(agentRecord.id) : [];
  const memoryBlock = memories.length > 0
    ? `## Persistent Memory\nFacts stored from previous runs:\n${memories.map(m => `- ${m.key}: ${m.value}`).join('\n')}`
    : '';
  const memoryInstructions = memoryEnabled
    ? `## Memory\nYou have a \`memory_write\` tool. Use it to persist facts that would be useful in future runs — user preferences, discovered values, key decisions, API endpoints, or any context worth recalling. Call it whenever you learn something worth remembering.`
    : '';
  const instructions = [substitutedInstructions, memoryBlock, memoryInstructions].filter(Boolean).join('\n\n') || undefined;

  const params = agentRecord.params_json ? JSON.parse(agentRecord.params_json) : {};

  const input_json = JSON.stringify({
    taskInput,
    systemPrompt: instructions ?? '',
    userPrompt: taskInput,
    configuration: {
      provider: agentRecord.provider,
      model: agentRecord.model,
      temperature: params.temperature,
      maxTokens: params.max_tokens,
    },
  });

  let executionId: string | undefined;

  const stepBuffer: ExecutionStep[] = [];
  let currentLoop = 0;
  let totalTokens = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let finalText = '';
  let snapshot_json = JSON.stringify({
    name: agentRecord.name,
    systemPrompt: instructions ?? '',
    configuration: {
      provider: agentRecord.provider,
      model: agentRecord.model,
      temperature: params.temperature,
      maxTokens: params.max_tokens,
    },
    maxIterations: agentRecord.max_iterations,
    timeoutSeconds: agentRecord.timeout_seconds,
  });

  // Emit task_received immediately so the UI shows something before the first LLM round-trip
  const taskInputStepId = crypto.randomUUID();
  const taskInputStartMs = Date.now();
  stepBuffer.push({
    id: taskInputStepId,
    type: 'task_input',
    label: 'Task',
    status: 'success',
    timestamp: ts(),
    content: taskInput,
  });
  setExecution(prev => ({ ...prev, steps: [...stepBuffer] }));

  try {
    // Insert execution record inside try so a failure here resets state via catch.
    executionId = await insertExecution({
      type: 'agent',
      runnable_id: agentRecord.id,
      snapshot_json: JSON.stringify({
        name: agentRecord.name,
        systemPrompt: instructions ?? '',
        configuration: {
          provider: agentRecord.provider,
          model: agentRecord.model,
          temperature: params.temperature,
          maxTokens: params.max_tokens,
        },
        maxIterations: agentRecord.max_iterations,
        timeoutSeconds: agentRecord.timeout_seconds,
      }),
      input_json,
      status: 'running',
      started_at,
    });

    setExecution(prev => ({ ...prev, executionId }));

    // Fetch all tools linked to this agent (local + shared) and convert to AI SDK format
    const linkedTools = await listToolsForEntity(agentRecord.id, 'agent');
    const aiTools = toolConfigToAiSdkTools(linkedTools, envVarsMap);

    if (memoryEnabled) {
      aiTools['memory_write'] = tool({
        description: 'Persist a key-value fact to memory for future runs. Use to store important findings, preferences, or context.',
        inputSchema: jsonSchema<{ key: string; value: string }>({
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Short identifier for this memory (e.g. "user_preference", "api_endpoint")' },
            value: { type: 'string', description: 'The value to store' },
          },
          required: ['key', 'value'],
          additionalProperties: false,
        }),
        execute: async ({ key, value }) => {
          await saveAgentMemory(agentRecord.id, key, value);
          return { stored: key };
        },
      });
    }
    // Update snapshot to include the actual tools used in this run
    snapshot_json = JSON.stringify({
      name: agentRecord.name,
      systemPrompt: instructions ?? '',
      configuration: {
        provider: agentRecord.provider,
        model: agentRecord.model,
        temperature: params.temperature,
        maxTokens: params.max_tokens,
      },
      maxIterations: agentRecord.max_iterations,
      timeoutSeconds: agentRecord.timeout_seconds,
      tools: linkedTools,
    });
    await updateExecution(executionId, { snapshot_json });

    const hasTools = Object.keys(aiTools).length > 0;

    const toolChoice =
      !hasTools
        ? undefined
        : agentRecord.tool_call_strategy === 'forced'
          ? ('required' as const)
          : agentRecord.tool_call_strategy === 'restricted'
            ? ('none' as const)
            : undefined; // 'auto': use SDK default

    const maxRetries =
      agentRecord.retry_policy === 'none'
        ? 0
        : agentRecord.retry_policy === 'fixed' || agentRecord.retry_policy === 'exponential'
          ? 3
          : 2; // fallback to SDK default

    const timeoutSignal = agentRecord.timeout_seconds
      ? AbortSignal.timeout(agentRecord.timeout_seconds * 1000)
      : null;
    const effectiveAbortSignal =
      abortSignal && timeoutSignal
        ? AbortSignal.any([abortSignal, timeoutSignal])
        : abortSignal ?? timeoutSignal ?? undefined;

    const result = streamText({
      model: createModel({ provider: agentRecord.provider, model: agentRecord.model }),
      ...(instructions ? { system: instructions } : {}),
      prompt: taskInput,
      ...(hasTools ? { tools: aiTools } : {}),
      ...(toolChoice !== undefined ? { toolChoice } : {}),
      maxRetries,
      stopWhen: stepCountIs(agentRecord.max_iterations ?? 10),
      temperature: params.temperature,
      maxOutputTokens: params.max_tokens,
      ...(effectiveAbortSignal ? { abortSignal: effectiveAbortSignal } : {}),
    });

    let pendingModelStepId: string | null = null;
    let pendingModelStartMs: number | null = null;
    const pendingToolStepIds = new Map<string, string>(); // toolCallId → stepId
    const pendingToolStartMs = new Map<string, number>(); // toolCallId → wall time at tool-call
    let stepText = '';
    let stepReasoning = '';
    let stepToolCalls: Array<{ tool: string; arguments: unknown }> = [];

    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case 'start-step': {
          currentLoop++;
          stepText = '';
          stepReasoning = '';
          stepToolCalls = [];
          const id = crypto.randomUUID();
          pendingModelStepId = id;
          pendingModelStartMs = Date.now();

          const taskIdx = stepBuffer.findIndex((s) => s.id === taskInputStepId);
          if (taskIdx !== -1 && stepBuffer[taskIdx].type === "task_input") {
            const waitMs = Date.now() - taskInputStartMs;
            stepBuffer[taskIdx] = {
              ...stepBuffer[taskIdx],
              duration: waitMs < 1 ? "0ms" : formatDuration(waitMs),
            };
          }

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
          stepText += chunk.text ?? '';
          break;
        }

        case 'reasoning-delta': {
          stepReasoning += chunk.text ?? '';
          break;
        }

        case 'tool-call': {
          stepToolCalls.push({ tool: chunk.toolName, arguments: chunk.input });
          const id = crypto.randomUUID();
          pendingToolStepIds.set(chunk.toolCallId, id);
          pendingToolStartMs.set(chunk.toolCallId, Date.now());
          const isMemoryWrite = chunk.toolName === 'memory_write';
          stepBuffer.push({
            id,
            type: isMemoryWrite ? 'memory_write' : 'tool_call',
            label: isMemoryWrite ? 'Memory Write' : chunk.toolName,
            status: 'running',
            loop: currentLoop,
            timestamp: ts(),
            content: JSON.stringify(chunk.input, null, 2),
          });
          break;
        }

        case 'tool-result': {
          const key = chunk.toolCallId ?? '';
          const stepId = pendingToolStepIds.get(key);
          if (stepId) {
            const idx = stepBuffer.findIndex(s => s.id === stepId);
            if (idx !== -1) {
              const startMs = pendingToolStartMs.get(key);
              const toolMs = startMs != null ? Date.now() - startMs : undefined;
              pendingToolStartMs.delete(key);
              stepBuffer[idx] = {
                ...stepBuffer[idx],
                status: 'success',
                duration:
                  toolMs != null ? (toolMs < 1 ? "0ms" : formatDuration(toolMs)) : undefined,
                content:
                  stepBuffer[idx].content +
                  '\n\n' +
                  JSON.stringify(chunk.output, null, 2),
              };
            }
            pendingToolStepIds.delete(key);
          }
          break;
        }

        case 'finish-step': {
          const u = chunk.usage;
          const inputTokens = u?.inputTokens ?? 0;
          const outputTokens = u?.outputTokens ?? 0;
          const stepTokens = u
            ? (u.totalTokens ?? inputTokens + outputTokens)
            : 0;
          totalTokens += stepTokens;
          totalInputTokens += inputTokens;
          totalOutputTokens += outputTokens;

          if (pendingModelStepId) {
            const idx = stepBuffer.findIndex(s => s.id === pendingModelStepId);
            if (idx !== -1) {
              const response: Record<string, unknown> = {};
              if (stepReasoning) response.reasoning = stepReasoning;
              if (stepText) response.text = stepText;
              if (stepToolCalls.length > 0) response.tool_calls = stepToolCalls;

              const content = Object.keys(response).length > 0
                ? JSON.stringify(response, null, 2)
                : '';

              const durationMs =
                pendingModelStartMs != null ? Date.now() - pendingModelStartMs : undefined;

              stepBuffer[idx] = {
                ...stepBuffer[idx],
                status: 'success',
                content,
                tokens: stepTokens || undefined,
                inputTokens: inputTokens || undefined,
                outputTokens: outputTokens || undefined,
                duration:
                  durationMs != null && durationMs > 0 ? formatDuration(durationMs) : undefined,
              };
            }
            pendingModelStepId = null;
            pendingModelStartMs = null;
          }
          break;
        }

        case 'error': {
          const errMsg = chunk.error instanceof Error
            ? chunk.error.message
            : String(chunk.error);
          throw new Error(errMsg);
        }
      }

      setExecution(prev => ({ ...prev, steps: [...stepBuffer], tokens: totalTokens }));
    }

    const streamEndedAtMs = Date.now();

    try {
      finalText = await result.text;
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') throw err;
      const lastModelContent =
        [...stepBuffer].reverse().find(s => s.type === 'model_call' && s.content)?.content ?? '';
      try {
        const parsed = JSON.parse(lastModelContent);
        finalText = parsed.text ?? lastModelContent;
      } catch {
        finalText = lastModelContent;
      }
    }

    const afterFinalTextMs = Date.now();
    const outputDurationMs = afterFinalTextMs - streamEndedAtMs;

    stepBuffer.push({
      id: crypto.randomUUID(),
      type: 'output',
      label: 'Final Response',
      status: 'success',
      timestamp: ts(),
      content: finalText,
      duration:
        outputDurationMs > 0
          ? formatDuration(outputDurationMs)
          : outputDurationMs === 0
            ? "0ms"
            : undefined,
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
      usage_json: JSON.stringify({
        totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      }),
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
    const isAborted =
      (error as { name?: string })?.name === 'AbortError' || abortSignal?.aborted === true;
    const errorMessage = isAborted
      ? 'Cancelled by user'
      : error instanceof Error ? error.message : 'Unknown error';

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

    if (executionId) {
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
    }

    setExecution(prev => ({
      ...prev,
      status: isAborted ? 'cancelled' : 'error',
      steps: stepsWithError,
    }));

    trackEvent(TELEMETRY_EVENTS.AGENT_RUN_FAILED, {
      agent_id: agentRecord.id,
      provider: agentRecord.provider,
      model: agentRecord.model,
      error_message: errorMessage,
    });
  }
}
