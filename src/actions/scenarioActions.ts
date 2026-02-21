import { generateText } from '@/lib/gateway';
import {
  insertExecution,
  insertScenario,
  updateScenario,
  updateExecution,
  upsertToolsForScenario,
  upsertAttachmentsForScenario,
} from '@/lib/storage';
import { StudioContainerState, HistoryItem } from '@/contexts/StudioContext';
import { Execution, Scenario } from '@/types';

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

type SetStudioState = React.Dispatch<React.SetStateAction<StudioContainerState>>;

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
    console.error("Failed to save execution:", error);
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
  console.log("Attempting to save scenario:", studioState.currentScenario);
  try {
    setStudioState(prev => ({ ...prev, isSaving: true }));

    const scenarioData = { ...studioState.currentScenario };
    if (scenarioName) {
      scenarioData.name = scenarioName;
    }

    // Use JSON draft when in Raw JSON mode; otherwise use Visual mode history
    const effectiveHistory =
      studioState.historyViewMode === 'json'
        ? parseHistoryJson(studioState.historyJsonDraft) ?? scenarioData.history
        : scenarioData.history;

    const now = Date.now();

    const scenarioPayload: Scenario = {
      collection_id: scenarioData.collection_id,
      title: scenarioData.name,
      description: null,
      provider: scenarioData.configuration.provider,
      model: scenarioData.configuration.model,
      system_prompt: scenarioData.systemPrompt,
      user_prompt: scenarioData.userPrompt,
      history_json: JSON.stringify(effectiveHistory),
      variables_json: null,
      params_json: JSON.stringify({
        temperature: scenarioData.configuration.temperature,
        topP: scenarioData.configuration.topP,
        maxTokens: scenarioData.configuration.maxTokens,
      }),
      response_format_json: null,
      tools_json: JSON.stringify(scenarioData.tools),
      provider_meta_json: null,
    };

    const existsInDb = studioState.savedScenarios.some((s) => s.id === studioState.currentScenario.id);
    let savedId = studioState.scenarioId;
    let created_at: number;
    let updated_at: number;

    if (existsInDb && studioState.scenarioId) {
      console.log("Updating existing scenario with ID:", studioState.scenarioId);
      created_at =
        scenarioData.createdAt != null ? new Date(scenarioData.createdAt).getTime() : now;
      updated_at = now;
      await updateScenario(studioState.scenarioId, scenarioPayload);
      await upsertToolsForScenario(scenarioData.tools ?? [], studioState.scenarioId);
      await upsertAttachmentsForScenario(
        scenarioData.attachments ?? [],
        studioState.scenarioId
      );
      console.log(`Scenario '${scenarioData.name}' updated.`);
    } else {
      console.log("Inserting new scenario.");
      savedId = await insertScenario(scenarioPayload);
      created_at = now;
      updated_at = now;
      await upsertToolsForScenario(scenarioData.tools ?? [], savedId);
      await upsertAttachmentsForScenario(scenarioData.attachments ?? [], savedId);
      console.log(`Scenario '${scenarioData.name}' inserted with ID: ${savedId}`);
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
      setPrevScenarioJson(JSON.stringify({ ...newState.currentScenario, id: null }));
      localStorage.setItem("lastUsedScenarioId", newState.currentScenario.id); // Set last used scenario after save
      console.log("Scenario saved. New state:", newState);
      return newState;
    });
  } catch (error) {
    console.error('Failed to save scenario:', error);
    setStudioState(prev => ({ ...prev, isSaving: false }));
    // Optionally show an error message in the UI
  }
}

export async function runScenarioAction(studioState: StudioContainerState, setStudioState: SetStudioState) {
  console.log("Running scenario:", studioState);
  const { currentScenario } = studioState;
  const { systemPrompt, userPrompt, configuration, history } = currentScenario;

  setStudioState((prev) => ({
    ...prev,
    isLoading: true,
    response: null,
    currentExecutionId: null,
  }));

  const scenarioId = currentScenario.id!;
  const snapshot = {
    name: currentScenario.name,
    systemPrompt,
    userPrompt,
    configuration,
    history,
    tools: currentScenario.tools,
    attachments: currentScenario.attachments,
  };
  const snapshot_json = JSON.stringify(snapshot);
  const input_json = JSON.stringify(snapshot);

  const started_at = Date.now();
  const executionId = await insertExecution({
    type: 'scenario',
    runnable_id: currentScenario.id,
    snapshot_json,
    input_json,
    status: 'running',
    started_at,
  });

  try {
    setStudioState(prev => ({ ...prev, currentExecutionId: executionId }));

    const result = await generateText(
      userPrompt,
      systemPrompt,
      history,
      {
        provider: configuration.provider,
        model: configuration.model,
        systemPrompt: systemPrompt, // Redundant here, but part of LLMCallConfig
        temperature: configuration.temperature,
        topP: configuration.topP,
        maxTokens: configuration.maxTokens,
      },
      currentScenario.tools,
      currentScenario.attachments
    );
    const ended_at = Date.now();

    const finalExecution: Execution = {
      type: 'scenario',
      runnable_id: scenarioId,
      snapshot_json,
      input_json,
      result_json: JSON.stringify({ text: result.text, usage: result.usage }),
      tool_calls_json:
        result.toolCalls?.length ?
          JSON.stringify(result.toolCalls) :
          undefined,
      steps_json:
        result.modelSteps?.length ?
          JSON.stringify(result.modelSteps) :
          undefined,
      status: 'succeeded',
      started_at,
      ended_at,
      usage_json: JSON.stringify({
        ...result.usage,
        latency_ms: result.latency,
        cost_usd: 0,
      }),
    };
    await updateExecution(executionId, finalExecution);
    setStudioState((prev) => ({
      ...prev,
      isLoading: false,
      response: {
        text: result.text,
        usage: result.usage,
        latency: result.latency,
        error: undefined,
      },
    }));
  } catch (error) {
    console.error('Error generating text:', error);
    const ended_at = Date.now();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    const failedExecution: Execution = {
      type: 'scenario',
      runnable_id: scenarioId,
      snapshot_json,
      input_json,
      status: 'failed',
      started_at,
      ended_at,
      error_json: JSON.stringify({ message: errorMessage }),
    };

    await updateExecution(executionId, failedExecution);

    setStudioState((prev) => ({
      ...prev,
      currentExecutionId: executionId,
      isLoading: false,
      response: {
        text: '',
        error: errorMessage,
        latency: undefined,
      },
      isSaved: false,
    }));
  }
}
