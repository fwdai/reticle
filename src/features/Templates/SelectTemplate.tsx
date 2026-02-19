import { PromptTemplate } from "@/components/ui/PromptBox/types";
import Select from "@/components/Layout/Select";

interface SelectTemplateProps {
  templates: PromptTemplate[];
  type: "system" | "user";
  onLoadTemplate: (template: PromptTemplate) => void;
}

export function SelectTemplate({
  templates,
  type,
  onLoadTemplate,
}: SelectTemplateProps) {
  return (
    <div className="w-full max-w-3xs space-y-2">
      <Select<PromptTemplate>
        items={templates}
        getItemId={(template) => template.name}
        getItemLabel={(template) => template.name}
        onSelect={onLoadTemplate}
        placeholder="Load Template..."
        filter={(template) => template.type === type}
      />
    </div>
  );
}
