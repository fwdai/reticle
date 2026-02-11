import { generateText } from '@/lib/gateway';
import {
  getOrCreateDefaultCollection,
  insertExecution,
  insertScenario,
  updateExecution,
  updateScenario,
  type ExecutionRow,
  type ScenarioRow,
} from '@/lib/storage';
import { StudioContainerState } from '@/contexts/StudioContext';

type SetStudioState = React.Dispatch<React.SetStateAction<StudioContainerState>>;

// --- Execution Actions ---

export async function saveExecution(
  data: Omit<ExecutionRow, 'created_at' | 'updated_at'>,
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
    setStudioState(prev => ({ ...prev, isLoading: true }));

    const scenarioData = { ...studioState.currentScenario };
    if (scenarioName) {
      scenarioData.name = scenarioName;
    }

    const collectionId = await getOrCreateDefaultCollection();
    const now = Date.now();

    const scenarioPayload: Omit<ScenarioRow, 'created_at' | 'updated_at'> = {
      collection_id: collectionId,
      title: scenarioData.name,
      description: null,
      provider: scenarioData.configuration.provider,
      model: scenarioData.configuration.model,
      system_prompt: scenarioData.systemPrompt,
      user_prompt: scenarioData.userPrompt,
      history_json: JSON.stringify(scenarioData.history),
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

    let savedId = studioState.scenarioId;
    let created_at: number;
    let updated_at: number;

    if (studioState.scenarioId) {
      console.log("Updating existing scenario with ID:", studioState.scenarioId);
      created_at =
        scenarioData.createdAt != null ? new Date(scenarioData.createdAt).getTime() : now;
      updated_at = now;
      await updateScenario(studioState.scenarioId, scenarioPayload);
      console.log(`Scenario '${scenarioData.name}' updated.`);
    } else {
      console.log("Inserting new scenario.");
      savedId = await insertScenario(scenarioPayload);
      created_at = now;
      updated_at = now;
      console.log(`Scenario '${scenarioData.name}' inserted with ID: ${savedId}`);
    }

    setStudioState(prev => {
      const newState = {
        ...prev,
        isLoading: false,
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
      console.log("Scenario saved. New state:", newState);
      return newState;
    });
  } catch (error) {
    console.error('Failed to save scenario:', error);
    setStudioState(prev => ({ ...prev, isLoading: false }));
    // Optionally show an error message in the UI
  }
}

export async function runScenarioAction(studioState: StudioContainerState, setStudioState: SetStudioState) {
  console.log("Running scenario:", studioState);
  const { currentScenario } = studioState;
  const { systemPrompt, userPrompt, configuration } = currentScenario;

  setStudioState((prev) => ({
    ...prev,
    isLoading: true,
    response: null,
    currentExecutionId: null,
  }));

  const scenarioId = currentScenario.id!;
  const snapshot = {
    systemPrompt,
    userPrompt,
    configuration,
    tools: currentScenario.tools,
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

    const result = await generateText(userPrompt, { systemPrompt, ...configuration });
    const ended_at = Date.now();

    const finalExecution: Omit<ExecutionRow, 'created_at' | 'updated_at'> = {
      type: 'scenario',
      runnable_id: scenarioId,
      snapshot_json,
      input_json,
      result_json: JSON.stringify({ text: result.text, usage: result.usage }),
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
    setStudioState((prev) => ({ ...prev, isLoading: false }));
  } catch (error) {
    console.error('Error generating text:', error);
    const ended_at = Date.now();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    const failedExecution: Omit<ExecutionRow, 'created_at' | 'updated_at'> = {
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
