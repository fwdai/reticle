import { useState } from "react";
import PromptBox from "@/components/ui/PromptBox"; // Adjust path as needed

interface Variable {
  id: number;
  key: string;
  value: string;
}

function Prompt() {
  const [prompt, setPrompt] = useState("");
  const [variables, setVariables] = useState<Variable[]>([
    { id: Date.now(), key: "", value: "" },
  ]);

  return (
    <PromptBox
      type="user"
      initialPromptValue={prompt}
      initialVariables={variables}
      onPromptChange={(newPrompt) => setPrompt(newPrompt)}
      onVariablesChange={(newVariables) => setVariables(newVariables)}
      showTemplateManager={true}
    />
  );
}

export default Prompt;
