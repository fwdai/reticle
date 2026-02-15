import React, { createContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { listPromptTemplates } from "@/lib/storage";
import type { PromptTemplate } from "@/types";

const NEW_TEMPLATE: PromptTemplate = {
  type: "user",
  name: "",
  content: "",
  variables_json: null,
};

export type TypeFilter = "all" | "system" | "user";

interface TemplatesContextType {
  templates: PromptTemplate[];
  loading: boolean;
  loadTemplates: () => Promise<PromptTemplate[]>;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
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
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const loadTemplates = useCallback(async (): Promise<PromptTemplate[]> => {
    setLoading(true);
    try {
      const rows = await listPromptTemplates();
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

  const value: TemplatesContextType = {
    templates,
    loading,
    loadTemplates,
    typeFilter,
    setTypeFilter,
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
