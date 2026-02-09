import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Tool } from '@/components/Layout/MainContent/Studio/Main/Tools/types';
import { invoke } from '@tauri-apps/api/core'; // For Tauri commands
import { v4 as uuidv4 } from 'uuid'; // For initial UUID generation for currentInteraction

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
}

// --- Context Definition ---

interface StudioContextType {
  studioState: StudioContainerState;
  setStudioState: React.Dispatch<React.SetStateAction<StudioContainerState>>;
  saveScenario: (scenarioName: string | null) => Promise<void>;
  createNewScenario: () => void;
  loadScenario: (id: string) => Promise<void>;
  fetchCollections: () => Promise<void>; // Added fetchCollections
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


  const getOrCreateDefaultCollection = useCallback(async (): Promise<string> => {
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
  }, []);

  const saveScenario = useCallback(async (scenarioName: string | null) => {
    console.log("Attempting to save scenario:", studioState.currentScenario);
    try {
      setStudioState(prev => ({ ...prev, isLoading: true }));

      const scenarioData = { ...studioState.currentScenario };
      if (scenarioName) {
        scenarioData.name = scenarioName;
      }

      const collectionId = await getOrCreateDefaultCollection(); // Get or create default collection ID

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
  }, [studioState.currentScenario, studioState.scenarioId, getOrCreateDefaultCollection]);

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

  return (
    <StudioContext.Provider value={{ studioState, setStudioState, saveScenario, createNewScenario, loadScenario, fetchCollections }}>
      {children}
    </StudioContext.Provider>
  );
};