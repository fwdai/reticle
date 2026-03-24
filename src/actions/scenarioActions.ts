import { streamText, extractStepsAndToolCalls } from '@/lib/gateway';
import {
  insertExecution,
  insertScenario,
  updateScenario,
  updateExecution,
  upsertToolsForScenario,
  upsertAttachmentsForScenario,
  listToolsForEntity,
  listEnvVariables,
} from '@/lib/storage';
import { TELEMETRY_EVENTS, trackEvent } from '@/lib/telemetry';
import { toast } from 'sonner';
import { StudioContainerState, HistoryItem } from '@/contexts/StudioContext';
import { Execution, Scenario } from '@/types';
import { substituteVariables } from '@/lib/helpers/substituteVariables';

function parseHistoryJson(jsonStr: string): HistoryItem[] | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is HistoryItem =>
        item &&
        typeof item === 'object' &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
    );
  } catch {
    return null;
  }
}

type SetStudioState = React.Dispatch<
  React.SetStateAction<StudioContainerState>
>;

// --- Execution Actions ---

export async function saveExecution(
  data: Execution,
  id?: string
): Promise<string> {
  try {
    if (id) {
      await updateExecution(id, data);
      console.log(`Execution ${id} updated.`);
      return id;
    }
    const executionId = await insertExecution(data);
    console.log(`Execution ${executionId} inserted.`);
    return executionId;
  } catch (error) {
    console.error('Failed to save execution:', error);
    throw error;
  }
}

// --- Scenario Actions ---

export async function saveScenarioAction(
  studioState: StudioContainerState,
  setStudioState: React.Dispatch<React.SetStateAction<StudioContainerState>>,
  setPrevScenarioJson: React.Dispatch<React.SetStateAction<string>>,
  scenarioName: string | null
) {
  const isExistingScenario =
    studioState.savedScenarios.some(
      scenario => scenario.id === studioState.currentScenario.id
    ) && Boolean(studioState.scenarioId);

  trackEvent(TELEMETRY_EVENTS.SCENARIO_SAVE_STARTED, {
    save_mode: isExistingScenario ? 'update' : 'create',
    has_scenario_id: Boolean(studioState.scenarioId),
    history_view_mode: studioState.historyViewMode,
    tools_count: studioState.currentScenario.tools?.length ?? 0,
    attachments_count: studioState.currentScenario.attachments?.length ?? 0,
  });

  console.log('Attempting to save scenario:', studioState.currentScenario);
  try {
    setStudioState(prev => ({ ...prev, isSaving: true }));

    const scenarioData = { ...studioState.currentScenario };
    if (scenarioName) {
      scenarioData.name = scenarioName;
    }

    // Use JSON draft when in Raw JSON mode; otherwise use Visual mode history
    const effectiveHistory =
      studioState.historyViewMode === 'json'
        ? (parseHistoryJson(studioState.historyJsonDraft) ??
          scenarioData.history)
        : scenarioData.history;

    const now = Date.now();

    const variablesPayload = {
      system: (scenarioData.systemVariables ?? []).map((v) => ({ key: v.key, value: v.value })),
      user: (scenarioData.userVariables ?? []).map((v) => ({ key: v.key, value: v.value })),
    };
    const scenarioPayload: Scenario = {
      collection_id: scenarioData.collection_id,
      title: scenarioData.name,
      description: null,
      provider: scenarioData.configuration.provider,
      model: scenarioData.configuration.model,
      system_prompt: scenarioData.systemPrompt,
      user_prompt: scenarioData.userPrompt,
      history_json: JSON.stringify(effectiveHistory),
      variables_json: JSON.stringify(variablesPayload),
      params_json: JSON.stringify({
        temperature: scenarioData.configuration.temperature,
        maxTokens: scenarioData.configuration.maxTokens,
      }),
      response_format_json: null,
      tools_json: JSON.stringify(scenarioData.tools),
      provider_meta_json: null,
    };

    let savedId = studioState.scenarioId;
    let created_at: number;
    let updated_at: number;

    if (studioState.scenarioId) {
      console.log(
        'Updating existing scenario with ID:',
        studioState.scenarioId
      );
      created_at =
        scenarioData.createdAt != null
          ? new Date(scenarioData.createdAt).getTime()
          : now;
      updated_at = now;
      await updateScenario(studioState.scenarioId, scenarioPayload);
      await upsertToolsForScenario(
        scenarioData.tools ?? [],
        studioState.scenarioId
      );
      await upsertAttachmentsForScenario(
        scenarioData.attachments ?? [],
        studioState.scenarioId
      );
      console.log(`Scenario '${scenarioData.name}' updated.`);
    } else {
      console.log('Inserting new scenario.');
      savedId = await insertScenario(scenarioPayload);
      created_at = now;
      updated_at = now;
      await upsertToolsForScenario(scenarioData.tools ?? [], savedId);
      await upsertAttachmentsForScenario(
        scenarioData.attachments ?? [],
        savedId
      );
      console.log(
        `Scenario '${scenarioData.name}' inserted with ID: ${savedId}`
      );
    }

    setStudioState(prev => {
      const newState = {
        ...prev,
        isSaving: false,
        isSaved: true,
        scenarioId: savedId,
        currentScenario: {
          ...scenarioData,
          id: savedId || scenarioData.id,
          createdAt: created_at.toString(),
          updatedAt: updated_at.toString(),
        },
      };
      setPrevScenarioJson(
        JSON.stringify({ ...newState.currentScenario, id: null })
      );
      localStorage.setItem('lastUsedScenarioId', newState.currentScenario.id); // Set last used scenario after save
      console.log('Scenario saved. New state:', newState);
      return newState;
    });

    trackEvent(TELEMETRY_EVENTS.SCENARIO_SAVE_SUCCEEDED, {
      save_mode: isExistingScenario ? 'update' : 'create',
      scenario_id: savedId,
      tools_count: scenarioData.tools?.length ?? 0,
      attachments_count: scenarioData.attachments?.length ?? 0,
    });
  } catch (error) {
    console.error('Failed to save scenario:', error);
    trackEvent(TELEMETRY_EVENTS.SCENARIO_SAVE_FAILED, {
      save_mode: isExistingScenario ? 'update' : 'create',
      error_message: error instanceof Error ? error.message : 'unknown_error',
    });
    setStudioState(prev => ({ ...prev, isSaving: false }));
    toast.error('Failed to save scenario', {
      description: error instanceof Error ? error.message : undefined,
    });
  }
}

export async function runScenarioAction(
  studioState: StudioContainerState,
  setStudioState: SetStudioState,
  abortSignal?: AbortSignal
) {
  const { currentScenario } = studioState;
  const { systemPrompt, userPrompt, configuration, history } = currentScenario;
  const { systemVariables = [], userVariables = [] } = currentScenario;

  if (!configuration.provider || !configuration.model) {
    toast.error('No model selected', { description: 'Choose a provider and model before running.' });
    return;
  }

  const rawEnvVars = await listEnvVariables();
  const envVars = rawEnvVars.map(v => ({ id: 0, key: v.key, value: v.value }));

  const resolvedSystemPrompt = substituteVariables(systemPrompt, [...envVars, ...systemVariables]);
  const resolvedUserPrompt = substituteVariables(userPrompt, [...envVars, ...userVariables]);

  trackEvent(TELEMETRY_EVENTS.SCENARIO_RUN_STARTED, {
    scenario_id: currentScenario.id,
    provider: configuration.provider,
    model: configuration.model,
    history_items: history.length,
    tools_count: currentScenario.tools?.length ?? 0,
    attachments_count: currentScenario.attachments?.length ?? 0,
  });

  setStudioState(prev => ({
    ...prev,
    isLoading: true,
    response: null,
    currentExecutionId: null,
  }));

  const scenarioId = currentScenario.id!;
  const started_at = Date.now();

  let executionId: string | undefined;
  let snapshot_json = '';
  let input_json = '';

  try {
    // Fetch tools and create execution record inside try so any failure here
    // still resets loading state via the catch block below.
    const allTools = await listToolsForEntity(scenarioId, 'scenario');

    const snapshot = {
      name: currentScenario.name,
      systemPrompt: resolvedSystemPrompt,
      userPrompt: resolvedUserPrompt,
      configuration,
      history,
      tools: allTools,
      attachments: currentScenario.attachments,
    };
    snapshot_json = JSON.stringify(snapshot);
    input_json = JSON.stringify(snapshot);

    executionId = await insertExecution({
      type: 'scenario',
      runnable_id: currentScenario.id,
      snapshot_json,
      input_json,
      status: 'running',
      started_at,
    });

    setStudioState(prev => ({ ...prev, currentExecutionId: executionId! }));

    const result = await streamText(
      resolvedUserPrompt,
      resolvedSystemPrompt,
      history,
      {
        provider: configuration.provider,
        model: configuration.model,
        systemPrompt: resolvedSystemPrompt,
        temperature: configuration.temperature,
        maxTokens: configuration.maxTokens,
      },
      allTools,
      currentScenario.attachments,
      abortSignal
    );

    // Stream text chunks to the frontend as they arrive
    let accumulatedText = '';
    for await (const chunk of result.textStream) {
      accumulatedText += chunk;
      setStudioState(prev => ({
        ...prev,
        response: {
          text: accumulatedText,
          error: undefined,
        },
      }));
    }

    const [finalText, usage, steps] = await Promise.all([
      result.text,
      result.totalUsage,
      result.steps,
    ]);
    const ended_at = Date.now();

    const { modelSteps, toolCalls } = steps?.length
      ? extractStepsAndToolCalls(
        steps.map(s => ({
          text: s.text ?? '',
          finishReason: s.finishReason ?? 'unknown',
          usage: s.usage,
          toolCalls: s.toolCalls ?? [],
          toolResults: s.toolResults ?? [],
        }))
      )
      : { modelSteps: [], toolCalls: [] };

    const finalUsage = usage ?? {};
    const usageForResponse = {
      promptTokens: finalUsage.inputTokens,
      completionTokens: finalUsage.outputTokens,
      totalTokens: finalUsage.totalTokens,
    };
    const finalExecution: Execution = {
      type: 'scenario',
      runnable_id: scenarioId,
      snapshot_json,
      input_json,
      result_json: JSON.stringify({ text: finalText, usage: finalUsage }),
      tool_calls_json: toolCalls?.length
        ? JSON.stringify(toolCalls)
        : undefined,
      steps_json: modelSteps?.length ? JSON.stringify(modelSteps) : undefined,
      status: 'succeeded',
      started_at,
      ended_at,
      usage_json: JSON.stringify({
        ...finalUsage,
        latency_ms: result.latency,
        cost_usd: 0,
      }),
    };
    await updateExecution(executionId, finalExecution);
    setStudioState(prev => ({
      ...prev,
      isLoading: false,
      response: {
        text: finalText ?? accumulatedText,
        usage: usageForResponse,
        latency: result.latency,
        error: undefined,
      },
    }));

    trackEvent(TELEMETRY_EVENTS.SCENARIO_RUN_SUCCEEDED, {
      scenario_id: scenarioId,
      provider: configuration.provider,
      model: configuration.model,
      latency_ms: result.latency,
      prompt_tokens: usageForResponse.promptTokens,
      completion_tokens: usageForResponse.completionTokens,
      total_tokens: usageForResponse.totalTokens,
      tool_calls_count: toolCalls?.length ?? 0,
      model_steps_count: modelSteps?.length ?? 0,
    });
  } catch (error) {
    console.error('Error generating text:', error);
    const ended_at = Date.now();
    const isAborted = (error as { name?: string })?.name === 'AbortError';
    const errorMessage = isAborted
      ? 'Cancelled by user'
      : error instanceof Error ? error.message : 'An unknown error occurred';

    if (executionId) {
      await updateExecution(executionId, {
        type: 'scenario',
        runnable_id: scenarioId,
        snapshot_json,
        input_json,
        status: 'failed',
        started_at,
        ended_at,
        error_json: JSON.stringify({ message: errorMessage }),
      });
    }

    setStudioState(prev => ({
      ...prev,
      ...(executionId ? { currentExecutionId: executionId } : {}),
      isLoading: false,
      response: {
        text: '',
        error: errorMessage,
        latency: undefined,
      },
      isSaved: false,
    }));

    trackEvent(TELEMETRY_EVENTS.SCENARIO_RUN_FAILED, {
      scenario_id: scenarioId,
      provider: configuration.provider,
      model: configuration.model,
      error_message: errorMessage,
    });
  }
}
