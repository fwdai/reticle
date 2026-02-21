import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Tool } from '@/features/Scenarios/MainContent/Editor/Main/Tools/types';
import { invoke } from '@tauri-apps/api/core';
import { listToolsByScenarioId, listAttachmentsByScenarioId, getLastExecutionForScenario, getSetting } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { saveScenarioAction, runScenarioAction } from '@/actions/scenarioActions';
import { fetchAndNormalizeModels } from '@/lib/modelManager';
import { Collection, Scenario } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { PROVIDERS_LIST } from '@/constants/providers';

// --- State Interfaces ---

export interface ConfigurationState {
  provider: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Path to blob file on disk (workspaces/<account_id>/blobs/<sha256>) */
  path?: string;
}

// This represents the scenario being actively edited in the UI
export interface CurrentScenario {
  id: string; // Can be a client-side UUID or a DB ULID
  name: string;
  collection_id: string;
  configuration: ConfigurationState;
  systemPrompt: string;
  userPrompt: string;
  tools: Tool[];
  history: HistoryItem[];
  attachments: AttachedFile[];
  createdAt?: string;
  updatedAt?: string;
}

// Response state for API calls
export interface ResponseState {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latency?: number; // in milliseconds
  error?: string;
}

// History panel view state (for save flow when in JSON mode)
export type HistoryViewMode = 'visual' | 'json';

// The top-level state for the studio feature
export interface StudioContainerState {
  currentScenario: CurrentScenario;
  savedScenarios: Scenario[]; // These are the raw DB-format scenarios
  collections: Collection[];
  isLoading: boolean;
  isSaving: boolean;
  response: ResponseState | null;
  scenarioId: string | null; // DB ULID of the loaded scenario
  isSaved: boolean;
  currentExecutionId: string | null;
  providerModels: Record<string, any[]>;
  historyViewMode: HistoryViewMode;
  historyJsonDraft: string;
}

// --- Context Definition ---

export type StudioViewMode = 'editor' | 'visualizer';

/** Tab indices: 0=System, 1=Input, 2=History, 3=Files, 4=Tools */
export type EditorTabIndex = 0 | 1 | 2 | 3 | 4;

interface StudioContextType {
  studioState: StudioContainerState;
  setStudioState: React.Dispatch<React.SetStateAction<StudioContainerState>>;
  viewMode: StudioViewMode;
  setViewMode: (mode: StudioViewMode) => void;
  activeEditorTab: EditorTabIndex;
  setActiveEditorTab: (tab: EditorTabIndex) => void;
  /** Switch to editor view and optionally focus a specific tab */
  navigateToEditor: (tab?: EditorTabIndex) => void;
  saveScenario: (scenarioName: string | null) => Promise<void>;
  createNewScenario: (overrides?: { provider?: string; model?: string }) => void;
  loadScenario: (id: string, defaults?: { provider: string; model: string }) => Promise<void>;
  /** Return to list view without loading a scenario */
  backToList: () => void;
  /** Currently selected collection filter (null = all) */
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
  fetchCollections: () => Promise<void>;
  fetchScenarios: () => Promise<void>;
  createCollection: (name: string) => Promise<void>;
  createScenario: (collectionId: string) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  runScenario: () => Promise<void>;
}

export const StudioContext = createContext<StudioContextType | undefined>(undefined);

// --- Provider ---

interface StudioProviderProps {
  children: ReactNode;
}

const LAST_USED_SCENARIO_ID_KEY = 'lastUsedScenarioId';

// --- Initial State ---

const initialScenario: CurrentScenario = {
  id: uuidv4(),
  name: 'New Scenario',
  collection_id: '',
  configuration: {
    provider: 'openai',
    model: 'gpt-4o-2024-05-13',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2048,
  },
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Hello, world!',
  tools: [],
  history: [],
  attachments: [],
};

// --- Provider Component ---

export const StudioProvider: React.FC<StudioProviderProps> = ({ children }) => {
  const { appState, setAppState } = useAppContext();
  const [viewMode, setViewMode] = useState<StudioViewMode>('editor');
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTabIndex>(0);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const navigateToEditor = useCallback((tab?: EditorTabIndex) => {
    setViewMode('editor');
    if (tab !== undefined) {
      setActiveEditorTab(tab);
    }
  }, []);
  const [studioState, setStudioState] = useState<StudioContainerState>({
    currentScenario: { ...initialScenario, id: uuidv4() }, // Temporary new scenario until last used is loaded
    savedScenarios: [],
    collections: [],
    isLoading: true, // Set to true initially to indicate loading of last used scenario
    isSaving: false,
    response: null,
    scenarioId: null, // This will be set after loading last used or creating new
    isSaved: true,
    currentExecutionId: null,
    providerModels: {},
    historyViewMode: 'visual',
    historyJsonDraft: '',
  });

  const initialScenarioJson = JSON.stringify({ ...initialScenario, id: null });
  const [prevScenarioJson, setPrevScenarioJson] = useState(initialScenarioJson);

  const DEBOUNCE_MS = 800;

  useEffect(() => {
    const currentScenarioCompare = JSON.stringify({ ...studioState.currentScenario, id: null });
    if (currentScenarioCompare !== prevScenarioJson) {
      setStudioState(prev => ({ ...prev, isSaved: false }));
    }
  }, [studioState.currentScenario, prevScenarioJson]);

  useEffect(() => {
    if (studioState.historyViewMode === 'json') {
      setStudioState(prev => ({ ...prev, isSaved: false }));
    }
  }, [studioState.historyViewMode, studioState.historyJsonDraft]);

  const fetchCollections = useCallback(async () => {
    try {
      const collections: Collection[] = await invoke('db_select_cmd', { table: 'collections', query: {} });
      setStudioState(prev => ({ ...prev, collections }));
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }, []);

  const fetchScenarios = useCallback(async () => {
    try {
      const scenarios: Scenario[] = await invoke('db_select_cmd', { table: 'scenarios', query: {} });
      setStudioState(prev => ({ ...prev, savedScenarios: scenarios }));
    } catch (error) {
      console.error("Failed to fetch scenarios:", error);
    }
  }, []);

  useEffect(() => {
    const initializeStudio = async () => {
      await fetchCollections();
      await fetchScenarios();

      // Load models and default provider/model from settings together
      const [models, savedProvider, savedModel] = await Promise.all([
        fetchAndNormalizeModels(),
        getSetting('default_provider'),
        getSetting('default_model'),
      ]);
      setStudioState(prev => ({ ...prev, providerModels: models }));

      // Validate and set defaults in AppContext
      const provider =
        savedProvider && PROVIDERS_LIST.some((p) => p.id === savedProvider)
          ? savedProvider
          : PROVIDERS_LIST[0]?.id ?? 'openai';
      const modelsForProvider = models[provider] ?? [];
      const model =
        savedModel && modelsForProvider.some((m) => m.id === savedModel)
          ? savedModel
          : modelsForProvider[0]?.id ?? initialScenario.configuration.model;
      setAppState(prev => ({ ...prev, defaultProvider: provider, defaultModel: model }));

      // Don't auto-load last used - show list view first for consistency with other features
      setStudioState(prev => ({
        ...prev,
        scenarioId: null,
        isLoading: false,
      }));
    };

    initializeStudio();
  }, []); // Empty dependency array means this runs once on mount

  const saveScenario = useCallback(async (scenarioName: string | null) => {
    await saveScenarioAction(studioState, setStudioState, setPrevScenarioJson, scenarioName);
    await fetchCollections();
    await fetchScenarios();
  }, [studioState, setStudioState, setPrevScenarioJson]);

  useEffect(() => {
    if (studioState.isLoading) return;
    if (studioState.isSaved) return;
    if (!studioState.scenarioId && !studioState.currentScenario.name.trim()) return;

    const timer = setTimeout(() => {
      saveScenario(null);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    studioState.currentScenario,
    studioState.historyViewMode,
    studioState.historyJsonDraft,
    studioState.isLoading,
    studioState.isSaved,
    studioState.scenarioId,
    saveScenario,
  ]);

  const createNewScenario = useCallback(
    (overrides?: { provider?: string; model?: string }) => {
      const provider = overrides?.provider ?? appState.defaultProvider ?? initialScenario.configuration.provider;
      const model = overrides?.model ?? appState.defaultModel ?? initialScenario.configuration.model;
      const newId = uuidv4();
      const scenarioConfig = {
        ...initialScenario.configuration,
        provider,
        model,
      };
      const newScenario = {
        ...initialScenario,
        id: newId,
        configuration: scenarioConfig,
      };
      setStudioState(prev => ({
        ...prev,
        currentScenario: newScenario,
        scenarioId: newId,
        isSaved: true,
        response: null,
        historyViewMode: 'visual' as const,
        historyJsonDraft: '',
      }));
      setPrevScenarioJson(JSON.stringify({ ...newScenario, id: null }));
      localStorage.setItem(LAST_USED_SCENARIO_ID_KEY, newId);
    },
    [appState.defaultProvider, appState.defaultModel]
  );

  const loadScenario = useCallback(async (id: string, defaults?: { provider: string; model: string }) => {
    try {
      setStudioState(prev => ({ ...prev, isLoading: true }));
      const result: Scenario[] = await invoke('db_select_cmd', {
        table: 'scenarios',
        query: { where: { id } },
      });

      if (result.length > 0) {
        const dbScenario = result[0];
        const configParams = JSON.parse(dbScenario.params_json || '{}');

        const toolsFromTable = await listToolsByScenarioId(dbScenario.id!);
        const tools =
          toolsFromTable.length > 0
            ? toolsFromTable
            : JSON.parse(dbScenario.tools_json || '[]');

        const attachments = await listAttachmentsByScenarioId(dbScenario.id!);

        let lastRunResponse: StudioContainerState['response'] = null;
        const lastExecution = await getLastExecutionForScenario(dbScenario.id!);
        if (lastExecution) {
          if (lastExecution.status === 'succeeded' && lastExecution.result_json) {
            try {
              const result = JSON.parse(lastExecution.result_json) as { text?: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } };
              const usageData = lastExecution.usage_json ? JSON.parse(lastExecution.usage_json) as { latency_ms?: number } : {};
              lastRunResponse = {
                text: result.text ?? '',
                usage: result.usage,
                latency: usageData.latency_ms,
                error: undefined,
              };
            } catch {
              // Ignore parse errors
            }
          } else if (lastExecution.status === 'failed' && lastExecution.error_json) {
            try {
              const err = JSON.parse(lastExecution.error_json) as { message?: string };
              lastRunResponse = {
                text: '',
                error: err.message ?? 'Execution failed',
              };
            } catch {
              lastRunResponse = { text: '', error: 'Execution failed' };
            }
          }
        }

        const loadedScenario: CurrentScenario = {
          id: dbScenario.id!,
          name: dbScenario.title,
          collection_id: dbScenario.collection_id,
          configuration: {
            provider: dbScenario.provider,
            model: dbScenario.model,
            temperature: configParams.temperature ?? 0.7,
            topP: configParams.topP ?? 1.0,
            maxTokens: configParams.maxTokens ?? 2048,
          },
          systemPrompt: dbScenario.system_prompt,
          userPrompt: dbScenario.user_prompt,
          tools,
          history: JSON.parse(dbScenario.history_json || '[]'),
          attachments,
          createdAt: dbScenario.created_at?.toString(),
          updatedAt: dbScenario.updated_at?.toString(),
        };

        setStudioState(prev => {
          const newState = {
            ...prev,
            currentScenario: loadedScenario,
            scenarioId: loadedScenario.id,
            isSaved: true,
            isLoading: false,
            response: lastRunResponse,
            historyViewMode: 'visual' as const,
            historyJsonDraft: '',
          };
          setPrevScenarioJson(JSON.stringify({ ...newState.currentScenario, id: null }));
          return newState;
        });
        console.log(`Scenario '${loadedScenario.name}' loaded.`);
        localStorage.setItem(LAST_USED_SCENARIO_ID_KEY, loadedScenario.id!);
      } else {
        console.error(`Scenario with ID '${id}' not found.`);
        setStudioState(prev => ({ ...prev, isLoading: false }));
        // If not found, clear from local storage and create a new scenario
        localStorage.removeItem(LAST_USED_SCENARIO_ID_KEY);
        createNewScenario(defaults ? { provider: defaults.provider, model: defaults.model } : undefined);
      }
    } catch (error) {
      console.error(`Failed to load scenario ${id}:`, error);
      setStudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, [setStudioState, setPrevScenarioJson, createNewScenario]);

  const backToList = useCallback(() => {
    setStudioState(prev => ({ ...prev, scenarioId: null }));
  }, []);

  const createScenario = useCallback(
    async (collectionId: string) => {
      try {
        setStudioState(prev => ({ ...prev, isLoading: true }));
        const provider = appState.defaultProvider ?? initialScenario.configuration.provider;
        const model = appState.defaultModel ?? initialScenario.configuration.model;
        const config = {
          ...initialScenario.configuration,
          provider,
          model,
        };
        const newScenario: Omit<Scenario, 'id' | 'created_at' | 'updated_at'> = {
          title: `New Scenario`,
          collection_id: collectionId,
          provider,
          model,
          system_prompt: initialScenario.systemPrompt,
          user_prompt: initialScenario.userPrompt,
          params_json: JSON.stringify(config),
          tools_json: JSON.stringify(initialScenario.tools),
          history_json: JSON.stringify(initialScenario.history),
        };

        const scenarioId: string = await invoke('db_insert_cmd', { table: 'scenarios', data: newScenario });
        await fetchScenarios();
        await loadScenario(scenarioId);
        setStudioState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error(`Failed to create scenario in collection ${collectionId}:`, error);
        setStudioState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [appState.defaultProvider, appState.defaultModel, fetchScenarios, loadScenario]
  );

  const runScenario = useCallback(async () => {

    await runScenarioAction(studioState, setStudioState);

  }, [studioState, setStudioState]);



  const createCollection = useCallback(async (name: string) => {
    console.log(`Creating collection '${name}'`);
    try {
      setStudioState(prev => ({ ...prev, isLoading: true }));
      await invoke('db_insert_cmd', { table: 'collections', data: { name } });

      await fetchCollections(); // Refresh collections after adding a new one
      setStudioState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      console.error(`Failed to create collection '${name}':`, error);
      setStudioState(prev => ({ ...prev, isLoading: false }));
    }

  }, [fetchCollections]); // Depend on fetchCollections to ensure it's up-to-date

  const deleteScenario = useCallback(async (id: string) => {
    try {
      setStudioState(prev => ({ ...prev, isLoading: true })); // Set loading true at the start
      await invoke('db_delete_cmd', { table: 'scenarios', query: { where: { id } } });
      await fetchScenarios(); // Re-fetch to get the updated list of scenarios

      setStudioState(prev => {
        let newState = { ...prev };
        const updatedSavedScenarios = newState.savedScenarios.filter(s => s.id !== id);

        if (prev.scenarioId === id || prev.currentScenario.id === id) {
          localStorage.removeItem(LAST_USED_SCENARIO_ID_KEY);
          if (updatedSavedScenarios.length > 0) {
            // Load the first available scenario if others exist
            loadScenario(updatedSavedScenarios[0].id!);
            newState = { ...newState, isLoading: false };
          } else {
            // Otherwise, create a new blank scenario
            createNewScenario();
            newState = { ...newState, isLoading: false };
          }
        } else {
          // If the deleted scenario was not the current one,
          // ensure prevScenarioJson is updated to reflect currentScenario's saved state.
          setPrevScenarioJson(JSON.stringify({ ...prev.currentScenario, id: null }));
          newState = { ...newState, isLoading: false };
        }
        return newState;
      });
    } catch (error) {
      console.error(`Failed to delete scenario ${id}:`, error);
      setStudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, [fetchScenarios, createNewScenario, loadScenario, setPrevScenarioJson, studioState.currentScenario, studioState.savedScenarios]);

  return (

    <StudioContext.Provider value={{ studioState, setStudioState, viewMode, setViewMode, activeEditorTab, setActiveEditorTab, navigateToEditor, saveScenario, createNewScenario, loadScenario, backToList, selectedCollectionId, setSelectedCollectionId, fetchCollections, fetchScenarios, createCollection, createScenario, deleteScenario, runScenario }}>

      {children}

    </StudioContext.Provider>

  );

};
