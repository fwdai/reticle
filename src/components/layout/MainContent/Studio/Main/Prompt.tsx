import { useContext } from "react";
import PromptBox from "@/components/ui/PromptBox"; // Adjust path as needed
import { StudioContext } from "@/contexts/StudioContext";

function Prompt() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error("Prompt must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const { userPrompt } = studioState.currentInteraction;

  const handlePromptChange = (newPrompt: string) => {
    setStudioState((prev) => ({
      ...prev,
      currentInteraction: {
        ...prev.currentInteraction,
        userPrompt: newPrompt,
      },
    }));
  };

  return (
    <PromptBox
      type="user"
      initialPromptValue={userPrompt}
      onPromptChange={handlePromptChange}
      showTemplateManager={true}
    />
  );
}

export default Prompt;
