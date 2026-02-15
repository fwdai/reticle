import { useState, useMemo, useCallback } from "react";
import { Clock, Variable } from "lucide-react";

import MainContent from "@/components/Layout/MainContent";
import Header from "@/features/Tempaltes/Header";
import { useTemplatesContext } from "@/contexts/TemplatesContext";
import type { PromptTemplate } from "@/types";
import { TemplateDetail } from "./TemplateDetail";

function parseVariableKeys(variablesJson: string | null | undefined): string[] {
  if (!variablesJson) return [];
  try {
    const parsed = JSON.parse(variablesJson);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function getVarCount(content: string): number {
  const matches = content.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.length : 0;
}

function formatLastUsed(lastUsedAt: number | null | undefined): string {
  if (!lastUsedAt) return "Never";
  const diff = Date.now() - lastUsedAt;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} mins ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} hours ago`;
  return `${Math.floor(diff / 86400_000)} days ago`;
}

function TemplatesPage() {
  const [search, setSearch] = useState("");
  const {
    templates,
    loading,
    loadTemplates,
    typeFilter,
    activeCollection,
    selectedTemplate,
    setSelectedTemplate,
    onCreateTemplate,
  } = useTemplatesContext();

  const handleTemplateSaved = useCallback(async () => {
    const rows = await loadTemplates();
    setSelectedTemplate((prev: PromptTemplate | null) => {
      if (!prev?.id) return prev;
      const updated = rows.find((t) => t.id === prev.id);
      return updated ?? prev;
    });
  }, [loadTemplates, setSelectedTemplate]);

  const handleTemplateCreated = useCallback(
    async (newTemplate: PromptTemplate) => {
      const rows = await loadTemplates();
      const created = rows.find((t) => t.id === newTemplate.id) ?? newTemplate;
      setSelectedTemplate(created);
    },
    [loadTemplates, setSelectedTemplate]
  );

  const filtered = useMemo(() => {
    let result = templates;

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (activeCollection) {
      result = result.filter(() => false);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          parseVariableKeys(t.variables_json).some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [templates, typeFilter, activeCollection, search]);

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
  };

  const handleBackFromDetail = () => {
    setSelectedTemplate(null);
  };

  // Show template detail view when a template is selected (including new)
  if (selectedTemplate) {
    return (
      <MainContent>
        <TemplateDetail
          template={selectedTemplate}
          onBack={handleBackFromDetail}
          onSaved={handleTemplateSaved}
          onCreated={handleTemplateCreated}
        />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <Header
        search={search}
        onSearchChange={setSearch}
        onCreateTemplate={onCreateTemplate}
        templateCount={filtered.length}
      />

      {/* ContentBody */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
        {loading ? (
          <p className="text-text-muted">Loading templates…</p>
        ) : filtered.length === 0 ? (
          <p className="text-text-muted">
            {search
              ? "No templates match your search."
              : "No templates saved yet. Go to the Scenario tab to create one!"}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((template) => {
              const variableKeys = parseVariableKeys(template.variables_json);
              const varCount =
                variableKeys.filter(Boolean).length || getVarCount(template.content);
              const preview = template.content
                .split("\n")
                .slice(0, 2)
                .join(" ")
                .slice(0, 120);
              const tags = variableKeys.filter(Boolean).slice(0, 3);

              return (
                <button
                  key={template.id ?? template.name}
                  onClick={() => handleSelectTemplate(template)}
                  className="group flex w-full items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-200 border-border-light bg-white shadow-sm"
                >
                  {/* Type badge */}
                  <span
                    className={`mt-0.5 inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] shrink-0 ${template.type === "system"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    title={template.type === "system" ? "System template" : "User template"}
                  >
                    {template.type === "system" ? "SYS" : "USR"}
                  </span>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate">
                        {template.name}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate leading-relaxed mb-2">
                      {preview}
                      {template.content.length > 120 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-3">
                      {tags.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-text-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right meta */}
                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-text-muted">
                    {varCount > 0 && (
                      <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-primary">
                        <Variable className="h-3 w-3" />
                        {varCount} var{varCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastUsed(template.last_used_at)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MainContent>
  );
}

export default TemplatesPage;
