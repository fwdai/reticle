import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveTemplate } from "@/features/Templates/SaveTemplate";
import { SelectTemplate } from "@/features/Templates/SelectTemplate";
import { usePromptTemplates } from "@/hooks/usePromptTemplates";
// types
import { PromptBoxProps, PromptTemplate, Variable } from "./types";

function PromptBox({
  type,
  initialPromptValue = "",
  initialVariables = [{ id: Date.now(), key: "", value: "" }],
  onPromptChange,
  onVariablesChange,
}: PromptBoxProps) {
  // local state for prompt and variables
  const [prompt, setPrompt] = useState(initialPromptValue);
  const [variables, setVariables] = useState<Variable[]>(initialVariables);

  // loads all templates and provides upsert function to add/update templates in the list
  const { templates, upsertTemplate, parseVariables } = usePromptTemplates();

  useEffect(() => {
    setPrompt(initialPromptValue);
  }, [initialPromptValue]);

  const handlePromptChangeInternal = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newPrompt = event.target.value;
    setPrompt(newPrompt);
    onPromptChange(newPrompt);
  };

  const handleVariableChange = (
    id: number,
    field: "key" | "value",
    text: string
  ) => {
    const updatedVariables = variables.map((v) =>
      v.id === id ? { ...v, [field]: text } : v
    );
    setVariables(updatedVariables);
    onVariablesChange(updatedVariables);
  };

  // variables handlers
  const addVariable = () => {
    const newVar: Variable = { id: Date.now(), key: "", value: "" };
    const updatedVariables = [...variables, newVar];
    setVariables(updatedVariables);
    onVariablesChange(updatedVariables);
  };

  const removeVariable = (id: number) => {
    const updatedVariables = variables.filter((v) => v.id !== id);
    setVariables(updatedVariables);
    onVariablesChange(updatedVariables);
  };

  const handleLoadTemplate = (template: PromptTemplate) => {
    const loadedVariables = parseVariables(template.variables_json);
    // Assign new IDs to the variables
    const variablesWithIds = loadedVariables.map((v, index) => ({
      id: Date.now() + index,
      key: v.key,
      value: "", // Reset values when loading template
    }));

    setPrompt(template.content);
    onPromptChange(template.content); // Inform parent about prompt change
    setVariables(variablesWithIds);
    onVariablesChange(variablesWithIds); // Inform parent about variables change
  };

  const handleTemplateSaved = (newTemplate: PromptTemplate) => {
    upsertTemplate(newTemplate);
  };

  const characterCount = prompt.length;
  const estimatedTokenCount = Math.round(characterCount / 4); // Simple heuristic

  const label = type === "system" ? "System Instructions" : "User Prompt";
  const placeholder =
    type === "system"
      ? "Type your system instructions here..."
      : "Enter your prompt here, using {{variables}} for placeholders...";

  return (
    <div className="max-w-4xl flex flex-col gap-8 mx-auto">
      {/* Prompt/System Textarea */}
      <div className="flex-1 bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden min-h-64">
        <div className="h-10 p-6 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {label}
          </span>
          <div className="flex items-center justify-end gap-4 w-full max-w-lg">
            <SelectTemplate
              templates={templates}
              type={type}
              onLoadTemplate={handleLoadTemplate}
            />
            <SaveTemplate
              type={type}
              content={prompt}
              variables={variables}
              templates={templates}
              onTemplateSaved={handleTemplateSaved}
            />
          </div>
        </div>
        <textarea
          className="flex-1 p-6 bg-transparent border-none focus:ring-0 text-sm resize-none text-text-main placeholder:text-gray-400"
          placeholder={placeholder}
          value={prompt}
          onChange={handlePromptChangeInternal}
        />
        <div className="px-5 py-2 border-t border-border-light bg-sidebar-light/30 flex justify-between items-center h-10">
          <div className="flex items-center gap-2"></div>
          <span className="text-[9px] text-text-muted uppercase">
            <span className="font-medium">{characterCount}</span> CHARACTERS • ~
            <span className="font-medium">{estimatedTokenCount}</span> TOKENS
            (approx.)
          </span>
        </div>
      </div>

      {/* Variables Table */}
      <div className="bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Variables
          </span>
          <button
            onClick={addVariable}
            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-primary transition-colors"
          >
            <Plus size={14} />
            ADD VARIABLE
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {variables.map((variable) => (
              <div key={variable.id} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="key"
                  value={variable.key}
                  onChange={(e) =>
                    handleVariableChange(variable.id, "key", e.target.value)
                  }
                  className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="value"
                  value={variable.value}
                  onChange={(e) =>
                    handleVariableChange(variable.id, "value", e.target.value)
                  }
                  className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <button
                  onClick={() => removeVariable(variable.id)}
                  className="text-text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptBox;
