import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SaveTemplate } from "@/features/Tempaltes/SaveTemplate";
// types
import { Template, PromptBoxProps, Variable } from "./types";

function PromptBox({
  type,
  initialPromptValue = "",
  initialVariables = [{ id: Date.now(), key: "", value: "" }],
  onPromptChange,
  onVariablesChange,
  showTemplateManager = false,
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState(initialPromptValue);
  const [variables, setVariables] = useState<Variable[]>(initialVariables);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");

  useEffect(() => {
    setPrompt(initialPromptValue);
  }, [initialPromptValue]);

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem("promptTemplates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []); // Empty dependency array means this runs once on mount

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

  const handleLoadTemplate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = event.target.value;
    setSelectedTemplateName(templateName);
    const templateToLoad = templates.find((t) => t.name === templateName);
    if (templateToLoad) {
      setPrompt(templateToLoad.prompt);
      onPromptChange(templateToLoad.prompt); // Inform parent about prompt change
      const loadedVariables = templateToLoad.variableKeys.map((key, index) => ({
        id: Date.now() + index, // Use Date.now() + index for unique IDs
        key: key,
        value: "", // Reset values when loading template
      }));
      setVariables(loadedVariables);
      onVariablesChange(loadedVariables); // Inform parent about variables change
    }
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
        <div className="h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            {label}
          </span>
          {showTemplateManager && ( // Conditionally render template manager UI
            <div className="flex items-center gap-4">
              <select
                value={selectedTemplateName}
                onChange={handleLoadTemplate} // Pass the event directly
                className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
              >
                <option value="">Load Template...</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              <SaveTemplate
                prompt={prompt}
                variables={variables}
                templates={templates}
                setTemplates={setTemplates}
                setSelectedTemplateName={setSelectedTemplateName}
              />
            </div>
          )}
        </div>
        <textarea
          className="flex-1 p-6 bg-transparent border-none focus:ring-0 text-sm resize-none text-text-main placeholder:text-gray-400"
          placeholder={placeholder}
          value={prompt}
          onChange={handlePromptChangeInternal}
        />
        <div className="px-5 py-2 border-t border-border-light bg-sidebar-light/30 flex justify-between items-center h-10">
          <div className="flex items-center gap-2">
            {/* <span className="size-1.5 bg-primary rounded-full"></span>
            <span className="text-[10px] text-text-muted font-medium">
              Auto-saving
            </span> */}
          </div>
          <span className="text-[9px] text-text-muted uppercase">
            <span className="font-medium">{characterCount}</span> CHARACTERS • ~
            <span className="font-me">{estimatedTokenCount}</span> TOKENS
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
