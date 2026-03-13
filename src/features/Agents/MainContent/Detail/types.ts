export interface AgentDetailAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  toolsCount: number;
  memoryEnabled: boolean;
  agentGoal?: string;
  systemInstructions?: string;
}

export interface AgentDetailProps {
  agent: AgentDetailAgent;
  onBack: () => void;
  onSaved?: () => void;
  onDelete?: () => void;
}
