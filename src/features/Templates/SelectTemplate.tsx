import { useEffect, useState } from "react";
import { PromptTemplate } from "@/components/ui/PromptBox/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const handleLoadTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);

    const templateToLoad = templates.find((t) => t.name === templateName);
    if (templateToLoad) {
      // Notify parent with the loaded template
      onLoadTemplate(templateToLoad);
    }
  };

  const filteredTemplates = templates.filter(
    (template) => template.type === type
  );

  return (
    <Select value={selectedTemplateName} onValueChange={handleLoadTemplate}>
      <SelectTrigger className="h-6 border-0 bg-transparent px-0 py-0 text-[10px] font-bold text-text-muted shadow-none focus:ring-0 hover:text-primary">
        <SelectValue placeholder="Load Template..." />
      </SelectTrigger>
      <SelectContent className="min-w-45 rounded-xl border border-border-light bg-white text-text-main shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)]">
        {filteredTemplates.map((template) => (
          <SelectItem
            key={template.name}
            value={template.name}
            className="text-xs font-medium text-text-main focus:bg-sidebar-light/60 focus:text-text-main"
          >
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
