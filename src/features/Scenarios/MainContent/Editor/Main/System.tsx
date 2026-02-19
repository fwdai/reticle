import { useContext } from "react";
import PromptBox from "@/components/ui/PromptBox"; // Adjust path as needed
import { StudioContext } from "@/contexts/StudioContext";
import { Variable } from "@/components/ui/PromptBox/types";

function SystemMessage() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error("SystemMessage must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const { systemPrompt } = studioState.currentScenario;

  const handlePromptChange = (newPrompt: string) => {
    setStudioState((prev) => ({
      ...prev,
      currentScenario: {
        ...prev.currentScenario,
        systemPrompt: newPrompt,
      },
    }));
  };

  const handleVariablesChange = (_variables: Variable[]) => {
    // TODO: Implement variable handling in the context
  };

  return (
    <PromptBox
      type="system"
      initialPromptValue={systemPrompt}
      onPromptChange={handlePromptChange}
      onVariablesChange={handleVariablesChange}
      showTemplateManager={true}
    />
  );
}

export default SystemMessage;
