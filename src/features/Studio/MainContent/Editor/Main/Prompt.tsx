import { useContext } from "react";
import PromptBox from "@/components/ui/PromptBox"; // Adjust path as needed
import { StudioContext } from "@/contexts/StudioContext";
import { Variable } from "@/components/ui/PromptBox/types";

function Prompt() {
  const context = useContext(StudioContext);

  if (!context) {
    throw new Error("Prompt must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const { userPrompt } = studioState.currentScenario;

  const handlePromptChange = (newPrompt: string) => {
    setStudioState((prev) => ({
      ...prev,
      currentScenario: {
        ...prev.currentScenario,
        userPrompt: newPrompt,
      },
    }));
  };

  const handleVariablesChange = (variables: Variable[]) => {
    // TODO: Implement variable handling in the context
    console.log("Variables changed:", variables);
  };

  return (
    <PromptBox
      type="user"
      initialPromptValue={userPrompt}
      onPromptChange={handlePromptChange}
      onVariablesChange={handleVariablesChange}
      showTemplateManager={true}
    />
  );
}

export default Prompt;
