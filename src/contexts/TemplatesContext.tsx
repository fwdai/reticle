import React, { createContext, useCallback, useEffect, type ReactNode } from "react";
import { listPromptTemplates } from "@/lib/storage";
import type { PromptTemplate } from "@/types";
import { usePersistedState } from "@/hooks/usePersistedState";

const NEW_TEMPLATE: PromptTemplate = {
  type: "user",
  name: "",
  content: "",
  variables_json: null,
};

export type TemplateFilter = "all" | "system" | "user" | "starred" | "recently_used" | "archived";

interface TemplatesContextType {
  templates: PromptTemplate[];
  loading: boolean;
  loadTemplates: () => Promise<PromptTemplate[]>;
  filter: TemplateFilter;
  setFilter: (filter: TemplateFilter) => void;
  activeCollection: string | null;
  setActiveCollection: (name: string | null) => void;
  selectedTemplate: PromptTemplate | null;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<PromptTemplate | null>>;
  onCreateTemplate: () => void;
}

export const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export function useTemplatesContext() {
  const ctx = React.useContext(TemplatesContext);
  if (!ctx) {
    throw new Error("useTemplatesContext must be used within TemplatesProvider");
  }
  return ctx;
}

interface TemplatesProviderProps {
  children: ReactNode;
}

export function TemplatesProvider({ children }: TemplatesProviderProps) {
  const [templates, setTemplates] = React.useState<PromptTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = usePersistedState<TemplateFilter>("templates:filter", "all");
  const [activeCollection, setActiveCollection] = React.useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<PromptTemplate | null>(null);

  const loadTemplates = useCallback(async (): Promise<PromptTemplate[]> => {
    setLoading(true);
    try {
      const rows = await listPromptTemplates({ archived: "all" });
      setTemplates(rows);
      return rows;
    } catch (err) {
      console.error("Failed to load templates:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const onCreateTemplate = useCallback(() => {
    setSelectedTemplate({ ...NEW_TEMPLATE });
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    setSelectedTemplate(null);
  }, [filter]);

  const value: TemplatesContextType = {
    templates,
    loading,
    loadTemplates,
    filter,
    setFilter,
    activeCollection,
    setActiveCollection,
    selectedTemplate,
    setSelectedTemplate,
    onCreateTemplate,
  };

  return (
    <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>
  );
}
