import { createContext, useContext, type ReactNode } from "react";
import type { AgentExecutionStatus, ExecutionStep } from "@/types";

export interface ExecutionState {
  status: AgentExecutionStatus;
  elapsedSeconds?: number;
  tokens?: number;
  provider?: string;
  model?: string;
  steps: ExecutionStep[];
  executionId?: string;
}

interface AgentContextType {
  /** Run the agent with the given task input. */
  runAgent: (taskInput?: string) => void;
  execution: ExecutionState;
  isRunning: boolean;
}

export const AgentContext = createContext<AgentContextType | undefined>(
  undefined
);

export function useAgentContext() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgentContext must be used within an AgentProvider");
  }
  return context;
}

interface AgentProviderProps {
  children: ReactNode;
  value: AgentContextType;
}

export function AgentProvider({ children, value }: AgentProviderProps) {
  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}
