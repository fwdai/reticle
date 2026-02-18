export type AgentStatus = "ready" | "needs-config" | "error" | "running";

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  model: string;
  toolsCount: number;
  memoryEnabled: boolean;
  starred: boolean;
  lastRun?: {
    timestamp: string;
    duration: string;
    tokens: string;
    cost: string;
  };
}
