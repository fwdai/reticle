import React, { createContext, useState, ReactNode } from 'react';

// Define the shape of the configuration state
export interface ConfigurationState {
  llmProvider: string;
  modelVariant: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

// Define the context shape
interface ConfigurationContextType {
  configuration: ConfigurationState;
  setConfiguration: React.Dispatch<React.SetStateAction<ConfigurationState>>;
}

// Create the context with a default value
export const ConfigurationContext = createContext<ConfigurationContextType | undefined>(undefined);

// Define the props for the provider
interface ConfigurationProviderProps {
  children: ReactNode;
}

// Create the provider component
export const ConfigurationProvider: React.FC<ConfigurationProviderProps> = ({ children }) => {
  const [configuration, setConfiguration] = useState<ConfigurationState>({
    llmProvider: 'OpenAI',
    modelVariant: 'gpt-4o-2024-05-13',
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2048,
  });

  return (
    <ConfigurationContext.Provider value={{ configuration, setConfiguration }}>
      {children}
    </ConfigurationContext.Provider>
  );
};
