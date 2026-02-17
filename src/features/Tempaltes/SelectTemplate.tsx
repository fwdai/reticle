import React, { useEffect, useState } from "react";
import { PromptTemplate } from "@/components/ui/PromptBox/types";

interface TemplateLoadProps {
  templates: PromptTemplate[];
  type: "system" | "user";
  onLoadTemplate: (template: PromptTemplate) => void;
}

export function SelectTemplate({
  templates,
  type,
  onLoadTemplate,
}: TemplateLoadProps) {
  const [selectedTemplateName, setSelectedTemplateName] = useState("");

  useEffect(() => {
    if (!selectedTemplateName) {
      return;
    }

    const hasSelectedTemplate = templates.some(
      (template) => template.name === selectedTemplateName
    );

    if (!hasSelectedTemplate) {
      setSelectedTemplateName("");
    }
  }, [selectedTemplateName, templates]);

  const handleLoadTemplate = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = event.target.value;
    setSelectedTemplateName(templateName);

    const templateToLoad = templates.find((t) => t.name === templateName);
    if (templateToLoad) {
      // Notify parent with the loaded template
      onLoadTemplate(templateToLoad);
    }
  };

  return (
    <select
      value={selectedTemplateName}
      onChange={handleLoadTemplate}
      className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
    >
      <option value="">Load Template...</option>
      {templates
        .filter((template) => template.type === type)
        .map((template) => (
          <option key={template.name} value={template.name}>
            {template.name}
          </option>
        ))}
    </select>
  );
}
