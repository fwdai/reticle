import { useCallback, useEffect, useState } from "react";
import { listPromptTemplates } from "@/lib/storage";
import { PromptTemplate } from "@/types/index";
import { Variable } from "@/components/ui/PromptBox/types";

interface UsePromptTemplatesResult {
  templates: PromptTemplate[];
  fetchTemplates: () => Promise<void>;
  upsertTemplate: (template: PromptTemplate) => void;
  parseVariables: (variablesJson: string | null | undefined) => Variable[];
}

export function usePromptTemplates(): UsePromptTemplatesResult {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  const parseVariables = useCallback(
    (variablesJson: string | null | undefined): Variable[] => {
      if (!variablesJson) return [];
      try {
        return JSON.parse(variablesJson);
      } catch (error) {
        console.error("Failed to parse variables JSON:", error);
        return [];
      }
    },
    []
  );

  const fetchTemplates = useCallback(async () => {
    try {
      const dbTemplates = (await listPromptTemplates()) as PromptTemplate[];
      setTemplates(dbTemplates);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const upsertTemplate = useCallback((template: PromptTemplate) => {
    setTemplates((prevTemplates) => [
      ...prevTemplates.filter((item) => item.name !== template.name),
      template,
    ]);
  }, []);

  return { templates, fetchTemplates, upsertTemplate, parseVariables };
}
