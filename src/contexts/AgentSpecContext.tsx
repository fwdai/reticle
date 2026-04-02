import { createContext, useContext, type ReactNode } from "react";

interface AgentSpecContextType {
  agentGoal: string;
  systemInstructions: string;
  maxIterations: number[];
  timeoutValue: number[];
  retryPolicy: string;
  toolCallStrategy: string;
  humanInTheLoop: boolean;
  setAgentGoal: (v: string) => void;
  setSystemInstructions: (v: string) => void;
  setMaxIterations: (v: number[]) => void;
  setTimeoutValue: (v: number[]) => void;
  setRetryPolicy: (v: string) => void;
  setToolCallStrategy: (v: string) => void;
  setHumanInTheLoop: (v: boolean) => void;
}

const AgentSpecContext = createContext<AgentSpecContextType | undefined>(undefined);

export function useAgentSpecContext() {
  const context = useContext(AgentSpecContext);
  if (!context) {
    throw new Error("useAgentSpecContext must be used within an AgentSpecProvider");
  }
  return context;
}

interface AgentSpecProviderProps {
  children: ReactNode;
  value: AgentSpecContextType;
}

export function AgentSpecProvider({ children, value }: AgentSpecProviderProps) {
  return (
    <AgentSpecContext.Provider value={value}>{children}</AgentSpecContext.Provider>
  );
}
