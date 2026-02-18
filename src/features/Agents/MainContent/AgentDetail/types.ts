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
