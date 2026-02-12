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
}

// --- Context Definition ---

interface StudioContextType {
  studioState: StudioContainerState;
  setStudioState: React.Dispatch<React.SetStateAction<StudioContainerState>>;
  saveScenario: (scenarioName: string | null) => Promise<void>;
  createNewScenario: () => void;
  loadScenario: (id: string) => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchScenarios: () => Promise<void>;
  runScenario: () => Promise<void>;
}

export const StudioContext = createContext<StudioContextType | undefined>(undefined);

// --- Provider ---

interface StudioProviderProps {
  children: ReactNode;
}

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
  const [studioState, setStudioState] = useState<StudioContainerState>({
    currentScenario: initialScenario,
    savedScenarios: [],
    collections: [],
    isLoading: false,
    response: null,
    scenarioId: null,
    isSaved: false,
    currentExecutionId: null,
    providerModels: {},
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
    fetchCollections();
    fetchScenarios();
  }, [fetchCollections, fetchScenarios]);

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
  }, [studioState, setStudioState, setPrevScenarioJson, fetchCollections, fetchScenarios]);

  const createNewScenario = useCallback(() => {
    setStudioState(prev => ({
      ...prev,
      currentScenario: { ...initialScenario, id: uuidv4() },
      scenarioId: null,
      isSaved: true,
      response: null,
    }));
    setPrevScenarioJson(JSON.stringify({ ...initialScenario, id: null }));
  }, []);

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
          };
          setPrevScenarioJson(JSON.stringify({ ...newState.currentScenario, id: null }));
          return newState;
        });
        console.log(`Scenario '${loadedScenario.name}' loaded.`);
      } else {
        console.error(`Scenario with ID '${id}' not found.`);
        setStudioState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error(`Failed to load scenario ${id}:`, error);
      setStudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const runScenario = useCallback(async () => {
    await runScenarioAction(studioState, setStudioState);
  }, [studioState, setStudioState]);

  return (
    <StudioContext.Provider value={{ studioState, setStudioState, saveScenario, createNewScenario, loadScenario, fetchCollections, fetchScenarios, runScenario }}>
      {children}
    </StudioContext.Provider>
  );
};
