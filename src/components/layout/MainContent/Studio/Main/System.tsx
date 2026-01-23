import { useContext } from "react";
import PromptBox from "@/components/ui/PromptBox"; // Adjust path as needed
import { StudioContext } from "@/contexts/StudioContext";

function SystemMessage() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error("SystemMessage must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const { systemPrompt } = studioState.currentInteraction;

  const handlePromptChange = (newPrompt: string) => {
    setStudioState((prev) => ({
      ...prev,
      currentInteraction: {
        ...prev.currentInteraction,
        systemPrompt: newPrompt,
      },
    }));
  };

  return (
    <PromptBox
      type="system"
      initialPromptValue={systemPrompt}
      onPromptChange={handlePromptChange}
      showTemplateManager={true}
    />
  );
}

export default SystemMessage;
