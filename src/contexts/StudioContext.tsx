import React, { createContext, useState, ReactNode } from 'react';
import { Tool } from '@/components/Layout/MainContent/Studio/Main/Tools/types';
import { v4 as uuidv4 } from 'uuid';

// --- State Interfaces ---

export interface ConfigurationState {
  llmProvider: string;
  modelVariant: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// Represents a single, saveable interaction
export interface Interaction {
  id: string; // Unique ID for the interaction
  name: string; // User-defined name for the saved interaction
  configuration: ConfigurationState;
  systemPrompt: string;
  userPrompt: string;
  tools: Tool[];
  history: HistoryItem[];
}

// The top-level state for the entire studio feature
export interface StudioContainerState {
  currentInteraction: Interaction;
  savedInteractions: Interaction[];
}

// --- Context Definition ---

interface StudioContextType {
  studioState: StudioContainerState;
  setStudioState: React.Dispatch<React.SetStateAction<StudioContainerState>>;
}

export const StudioContext = createContext<StudioContextType | undefined>(undefined);

// --- Provider ---

interface StudioProviderProps {
  children: ReactNode;
}

// --- Initial State ---

const initialInteraction: Interaction = {
  id: uuidv4(),
  name: 'New Interaction',
  configuration: {
    llmProvider: 'OpenAI',
    modelVariant: 'gpt-4o-2024-05-13',
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
    currentInteraction: initialInteraction,
    savedInteractions: [],
  });

  return (
    <StudioContext.Provider value={{ studioState, setStudioState }}>
      {children}
    </StudioContext.Provider>
  );
};
