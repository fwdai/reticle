import { useState } from "react";
import PromptBox from "@/components/ui/PromptBox"; // Adjust path as needed

function SystemMessage() {
  const [message, setMessage] = useState("");
  const [variables, setVariables] = useState([
    { id: Date.now(), key: "", value: "" },
  ]);

  const handlePromptChange = (newPrompt: string) => {
    setMessage(newPrompt);
  };

  const handleVariablesChange = (newVariables: { key: string; value: string }[]) => {
    // Ensure variables are in the expected format with IDs
    setVariables(
      newVariables.map((v, index) => ({
        id: v.id || Date.now() + index, // Ensure ID exists, generate if missing (though PromptBox should handle this)
        key: v.key,
        value: v.value,
      }))
    );
  };

  return (
    <PromptBox
      type="system"
      initialPromptValue={message}
      initialVariables={variables}
      onPromptChange={handlePromptChange}
      onVariablesChange={handleVariablesChange}
      showTemplateManager={true}
    />
  );
}

export default SystemMessage;
