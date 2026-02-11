import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Tool } from '@/components/Layout/MainContent/Studio/Main/Tools/types';
import { invoke } from '@tauri-apps/api/core'; // For Tauri commands
import { v4 as uuidv4 } from 'uuid'; // For initial UUID generation for currentInteraction
import { saveScenarioAction, runScenarioAction } from '@/actions/scenarioActions';
import { fetchAndNormalizeModels } from '@/lib/modelManager';

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

export interface Collection {
  id: string;
  name: string;
  description?: string;
  created_at: number;
  updated_at: number;
  archived_at?: number;
}

// Represents a single, saveable interaction (now Scenario)
export interface Scenario {
  id: string; // Unique ID for the scenario (ULID for saved ones)
  name: string; // User-defined name for the scenario
  collection_id: string; // Foreign key to collections table
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

// The top-level state for the entire studio feature (now Scenario editing)
export interface StudioContainerState {
  currentScenario: Scenario; // Renamed from currentInteraction
  savedScenarios: Scenario[]; // Renamed from savedInteractions
  collections: Collection[]; // List of collections
  isLoading: boolean;
  response: ResponseState | null;
  scenarioId: string | null; // ID of the currently loaded/saved scenario from DB
  isSaved: boolean; // Indicates if currentScenario matches a saved version
  currentExecutionId: string | null; // ID of the current execution for tracking
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
  runScenario: () => Promise<void>;
}

export const StudioContext = createContext<StudioContextType | undefined>(undefined);

// --- Provider ---

interface StudioProviderProps {
  children: ReactNode;
}

// --- Initial State ---

const initialScenario: Scenario = { // Renamed from initialInteraction
  id: uuidv4(), // Client-side ID for unsaved scenario
  name: 'New Scenario', // Renamed from 'New Interaction'
  collection_id: '', // Default for now
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
    collections: [], // Initialized collections
    isLoading: false,
    response: null,
    scenarioId: null,
    isSaved: false, // Changed from true to false
    currentExecutionId: null, // Initialized currentExecutionId
    providerModels: {}, // Initialized providerModels
  });

  // Track changes to currentScenario to set isSaved to false
  const initialScenarioJson = JSON.stringify({ ...initialScenario, id: null }); // Don't compare UUIDs
  const [prevScenarioJson, setPrevScenarioJson] = useState(initialScenarioJson);

  useEffect(() => {
    // Deep compare currentScenario with the last saved/loaded version
    const currentScenarioCompare = JSON.stringify({ ...studioState.currentScenario, id: null }); // Ignore client-side UUID
    if (currentScenarioCompare !== prevScenarioJson) {
      setStudioState(prev => ({ ...prev, isSaved: false }));
    } else if (studioState.scenarioId === null) {
      // If it's a brand new scenario and hasn't been edited, it's considered saved
      setStudioState(prev => ({ ...prev, isSaved: true }));
    }
  }, [studioState.currentScenario, prevScenarioJson, studioState.scenarioId]);

  const fetchCollections = useCallback(async () => {
    try {
      const collections: any[] = await invoke('db_select_cmd', { table: 'collections', query: {} });
      setStudioState(prev => ({ ...prev, collections: collections as Collection[] }));
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    }
  }, []);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Fetch models for all providers on mount
  useEffect(() => {
    const loadModels = async () => {
      const models = await fetchAndNormalizeModels();
      setStudioState(prev => ({ ...prev, providerModels: models }));
    };
    loadModels();
  }, []);

  const saveScenario = useCallback(async (scenarioName: string | null) => {
    await saveScenarioAction(studioState, setStudioState, setPrevScenarioJson, scenarioName);
  }, [studioState, setStudioState, setPrevScenarioJson]);

  const createNewScenario = useCallback(() => {
    setStudioState(prev => ({
      ...prev,
      currentScenario: { ...initialScenario, id: uuidv4() }, // New client-side UUID for current interaction
      scenarioId: null, // No saved ID
      isSaved: true, // Considered saved until edited
      response: null,
    }));
    setPrevScenarioJson(JSON.stringify({ ...initialScenario, id: null })); // Reset comparison JSON
  }, []);

  const loadScenario = useCallback(async (id: string) => {
    try {
      setStudioState(prev => ({ ...prev, isLoading: true }));
      const result: any[] = await invoke('db_select_cmd', {
        table: 'scenarios',
        query: { where: { id } },
      });

      if (result.length > 0) {
        const loadedScenario = result[0] as Scenario;
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
        // Optionally create a new one or show error
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
    <StudioContext.Provider value={{ studioState, setStudioState, saveScenario, createNewScenario, loadScenario, fetchCollections, runScenario }}>
      {children}
    </StudioContext.Provider>
  );
};
