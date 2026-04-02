import { GoalPanel } from "./GoalPanel";
import { SystemInstructionsPanel } from "./SystemInstructionsPanel";
import { LoopControlsPanel } from "./LoopControlsPanel";
import { useAgentSpecContext } from "@/contexts/AgentSpecContext";

export function Tab() {
  const { agentGoal, setAgentGoal, systemInstructions, setSystemInstructions } =
    useAgentSpecContext();

  return (
    <div className="space-y-5">
      <GoalPanel value={agentGoal} onChange={setAgentGoal} />
      <SystemInstructionsPanel value={systemInstructions} onChange={setSystemInstructions} />
      <LoopControlsPanel />
    </div>
  );
}
