import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Tool } from '@/features/Studio/MainContent/Main/Tools/types';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { saveScenarioAction, runScenarioAction } from '@/actions/scenarioActions';
import { fetchAndNormalizeModels } from '@/lib/modelManager';
import { Collection, Scenario } from '@/types';

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

interface StudioContextType {
  studioState: StudioContainerState;
  setStudioState: React.Dispatch<React.SetStateAction<StudioContainerState>>;
  viewMode: StudioViewMode;
  setViewMode: (mode: StudioViewMode) => void;
  saveScenario: (scenarioName: string | null) => Promise<void>;
  createNewScenario: () => void;
  loadScenario: (id: string) => Promise<void>;
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
};

// --- Provider Component ---

export const StudioProvider: React.FC<StudioProviderProps> = ({ children }) => {
  const [viewMode, setViewMode] = useState<StudioViewMode>('editor');
  const [studioState, setStudioState] = useState<StudioContainerState>({
    currentScenario: { ...initialScenario, id: uuidv4() }, // Temporary new scenario until last used is loaded
    savedScenarios: [],
    collections: [],
    isLoading: true, // Set to true initially to indicate loading of last used scenario
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

  useEffect(() => {
    const currentScenarioCompare = JSON.stringify({ ...studioState.currentScenario, id: null });
    if (currentScenarioCompare !== prevScenarioJson) {
      setStudioState(prev => ({ ...prev, isSaved: false }));
    }
  }, [studioState.currentScenario, prevScenarioJson]);

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

      const lastUsedScenarioId = localStorage.getItem(LAST_USED_SCENARIO_ID_KEY);
      if (lastUsedScenarioId) {
        await loadScenario(lastUsedScenarioId);
      } else {
        createNewScenario();
      }
      setStudioState(prev => ({ ...prev, isLoading: false }));
    };

    initializeStudio();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const loadModels = async () => {
      const models = await fetchAndNormalizeModels();
      setStudioState(prev => ({ ...prev, providerModels: models }));
    };
    loadModels();
  }, []);

  const saveScenario = useCallback(async (scenarioName: string | null) => {
    await saveScenarioAction(studioState, setStudioState, setPrevScenarioJson, scenarioName);
    await fetchCollections();
    await fetchScenarios();
  }, [studioState, setStudioState, setPrevScenarioJson]);

  const createNewScenario = useCallback(() => {
    const newId = uuidv4();
    setStudioState(prev => ({
      ...prev,
      currentScenario: { ...initialScenario, id: newId },
      scenarioId: newId,
      isSaved: true,
      response: null,
      historyViewMode: 'visual' as const,
      historyJsonDraft: '',
    }));
    setPrevScenarioJson(JSON.stringify({ ...initialScenario, id: null }));
    localStorage.setItem(LAST_USED_SCENARIO_ID_KEY, newId);
  }, [setStudioState, setPrevScenarioJson]);

  const loadScenario = useCallback(async (id: string) => {
    try {
      setStudioState(prev => ({ ...prev, isLoading: true }));
      const result: Scenario[] = await invoke('db_select_cmd', {
        table: 'scenarios',
        query: { where: { id } },
      });

      if (result.length > 0) {
        const dbScenario = result[0];
        const configParams = JSON.parse(dbScenario.params_json || '{}');

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
          tools: JSON.parse(dbScenario.tools_json || '[]'),
          history: JSON.parse(dbScenario.history_json || '[]'),
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
            response: null,
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
        createNewScenario();
      }
    } catch (error) {
      console.error(`Failed to load scenario ${id}:`, error);
      setStudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, [setStudioState, setPrevScenarioJson, createNewScenario]);

  const createScenario = useCallback(async (collectionId: string) => {
    try {
      setStudioState(prev => ({ ...prev, isLoading: true }));
      const newScenario: Omit<Scenario, 'id' | 'created_at' | 'updated_at'> = {
        title: `New Scenario`,
        collection_id: collectionId,
        provider: initialScenario.configuration.provider,
        model: initialScenario.configuration.model,
        system_prompt: initialScenario.systemPrompt,
        user_prompt: initialScenario.userPrompt,
        params_json: JSON.stringify(initialScenario.configuration),
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
  }, [setStudioState, fetchScenarios, loadScenario]);

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

    <StudioContext.Provider value={{ studioState, setStudioState, viewMode, setViewMode, saveScenario, createNewScenario, loadScenario, fetchCollections, fetchScenarios, createCollection, createScenario, deleteScenario, runScenario }}>

      {children}

    </StudioContext.Provider>

  );

};
