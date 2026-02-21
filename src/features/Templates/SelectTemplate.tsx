import { useEffect, useState } from "react";
import { PromptTemplate } from "@/components/ui/PromptBox/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectTemplateProps {
  templates: PromptTemplate[];
  type: "system" | "user";
  onLoadTemplate: (template: PromptTemplate) => void;
  value?: string;
}

export function SelectTemplate({
  templates,
  type,
  onLoadTemplate,
  value = "",
}: SelectTemplateProps) {
  const [selectedName, setSelectedName] = useState(value);
  const filteredTemplates = templates.filter((t) => t.type === type);

  useEffect(() => {
    setSelectedName(value);
  }, [value]);

  const handleSelect = (id: string) => {
    const template = filteredTemplates.find((t) => t.name === id);
    if (template) {
      setSelectedName(template.name);
      onLoadTemplate(template);
    }
  };

  return (
    <Select value={selectedName} onValueChange={handleSelect}>
      <SelectTrigger
        className="h-8 w-auto min-w-0 max-w-[180px] border-0 bg-transparent px-2 py-1.5 text-[11px] font-medium text-text-muted shadow-none hover:bg-slate-200/60 hover:text-text-main focus:ring-0 focus:ring-offset-0 [&>svg]:size-3.5"
      >
        <SelectValue placeholder="Load Template…" />
      </SelectTrigger>
      <SelectContent className="rounded-lg border border-border-light bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {filteredTemplates.map((template) => (
          <SelectItem
            key={template.name}
            value={template.name}
            className="py-2.5 pl-8 pr-3 text-sm text-text-main focus:bg-slate-50"
          >
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
