export interface AgentDetailAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  toolsCount: number;
  memoryEnabled: boolean;
}

export interface AgentDetailProps {
  agent: AgentDetailAgent;
  onBack: () => void;
}

export interface RunRecord {
  id: string;
  status: "success" | "error" | "running";
  loops: number;
  tokens: string;
  cost: string;
  latency: string;
  timestamp: string;
}
