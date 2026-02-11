import { generateText } from '@/lib/gateway';
import { invoke } from '@tauri-apps/api/core';
import { StudioContainerState } from '@/types/studio';

type SetStudioState = React.Dispatch<React.SetStateAction<StudioContainerState>>;

// --- Execution Actions ---

export async function saveExecution(data: any, id?: string): Promise<string> {
  try {
    const now = Date.now();
    let executionId: string;
    const executionData = { ...data, updated_at: now };

    if (id) {
      await invoke('db_update_cmd', { table: 'executions', query: { where: { id } }, data: executionData });
      executionId = id;
      console.log(`Execution ${id} updated.`);
    } else {
      const newId: string = await invoke('db_insert_cmd', {
        table: 'executions',
        data: { ...executionData, created_at: now },
      });
      executionId = newId;
      console.log(`Execution ${executionId} inserted.`);
    }
    return executionId;
  } catch (error) {
    console.error("Failed to save execution:", error);
    throw error;
  }
}

// --- Scenario Actions ---

export async function getOrCreateDefaultCollection(): Promise<string> {
  try {
    const existingCollections: any[] = await invoke('db_select_cmd', {
      table: 'collections',
      query: { where: { name: 'Default Collection' } },
    });

    if (existingCollections.length > 0) {
      return existingCollections[0].id;
    } else {
      const now = Date.now();
      const newCollection = {
        name: 'Default Collection',
        created_at: now,
        updated_at: now,
        description: 'Default collection for scenarios',
      };
      const newCollectionId: string = await invoke('db_insert_cmd', {
        table: 'collections',
        data: newCollection,
      });
      console.log("Created Default Collection with ID:", newCollectionId);
      return newCollectionId;
    }
  } catch (error) {
    console.error("Failed to get or create default collection:", error);
    throw error;
  }
}

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

    const collectionId = await getOrCreateDefaultCollection(); // Use the extracted function

    // Prepare data for database insertion/update
    const now = Date.now(); // Current Unix timestamp in milliseconds

    const dbScenario = {
      id: scenarioData.id, // Will be overridden by db_insert for new scenarios if null
      collection_id: collectionId, // Assign the collection ID
      title: scenarioData.name,
      provider: scenarioData.configuration.provider,
      model: scenarioData.configuration.model,
      system_prompt: scenarioData.systemPrompt,
      user_prompt: scenarioData.userPrompt,
      history_json: JSON.stringify(scenarioData.history),
      tools_json: JSON.stringify(scenarioData.tools),
      params_json: JSON.stringify({
        temperature: scenarioData.configuration.temperature,
        topP: scenarioData.configuration.topP,
        maxTokens: scenarioData.configuration.maxTokens,
        // Add other configuration parameters as needed (e.g., seed, etc.)
      }),
      variables_json: null, // No variables in context yet
      response_format_json: null, // No response format in context yet
      provider_meta_json: null, // No provider meta in context yet
      created_at: studioState.scenarioId && scenarioData.createdAt
        ? new Date(scenarioData.createdAt).getTime() // Use existing created_at for updates
        : now, // Generate new created_at for new inserts
      updated_at: now,
    };

    let savedId = studioState.scenarioId;
    if (studioState.scenarioId) {
      console.log("Updating existing scenario with ID:", studioState.scenarioId);
      await invoke('db_update_cmd', {
        table: 'scenarios',
        query: { where: { id: studioState.scenarioId } },
        data: dbScenario,
      });
      console.log(`Scenario '${scenarioData.name}' updated.`);
    } else {
      console.log("Inserting new scenario.");
      savedId = await invoke('db_insert_cmd', {
        table: 'scenarios',
        data: dbScenario,
      });
      console.log(`Scenario '${scenarioData.name}' inserted with ID: ${savedId}`);
    }

    setStudioState(prev => {
      const newState = {
        ...prev,
        isLoading: false,
        isSaved: true,
        scenarioId: savedId,
        currentScenario: { ...scenarioData, id: savedId || scenarioData.id, createdAt: dbScenario.created_at.toString(), updatedAt: dbScenario.updated_at.toString() },
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
  if (!studioState.scenarioId) {
    console.error("Cannot run an unsaved scenario. Please save the scenario first.");
    return;
  }

  const { currentScenario, scenarioId } = studioState;
  const { systemPrompt, userPrompt, configuration } = currentScenario;

  setStudioState((prev) => ({
    ...prev,
    isLoading: true,
    response: null,
    currentExecutionId: null,
  }));

  let executionId: string | null = null;
  try {
    const initialExecution = {
      scenario_id: scenarioId,
      provider: configuration.provider,
      model: configuration.model,
      status: 'running',
      input_json: JSON.stringify({ systemPrompt, userPrompt, configuration, tools: currentScenario.tools }),
    };
    // executionId = await saveExecution(initialExecution);
    setStudioState(prev => ({ ...prev, currentExecutionId: executionId }));

    const result = await generateText(userPrompt, { systemPrompt, ...configuration });
    const latency = result.latency;

    const finalExecution = {
      provider: configuration.provider,
      model: configuration.model,
      status: 'success',
      input_json: JSON.stringify({ systemPrompt, userPrompt, configuration, tools: currentScenario.tools }),
      output_json: JSON.stringify({ text: result.text, usage: result.usage }),
      latency_ms: latency,
      tokens_used_json: JSON.stringify(result.usage),
      cost_usd: 0,
    };
    await saveExecution(finalExecution, executionId);

    setStudioState((prev) => ({
      ...prev,
      isLoading: false,
      response: {
        text: result.text,
        usage: result.usage ? {
          promptTokens: result.usage.inputTokens,
          completionTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
        } : undefined,
        latency,
      },
      isSaved: false,
    }));
  } catch (error) {
    console.error('Error generating text:', error);

    const failedExecution = {
      provider: configuration.provider,
      model: configuration.model,
      status: 'failed',
      input_json: JSON.stringify({ systemPrompt, userPrompt, configuration, tools: currentScenario.tools }),
      output_json: JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
      latency_ms: 0,
      tokens_used_json: null,
      cost_usd: 0,
    };
    if (executionId) {
      await saveExecution(failedExecution, executionId);
    }

    setStudioState((prev) => ({
      ...prev,
      isLoading: false,
      response: {
        text: '',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        latency: undefined,
      },
      isSaved: false,
    }));
  }
}
