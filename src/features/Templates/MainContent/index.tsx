import { useState, useMemo, useCallback } from "react";
import { FileCode, Variable, Copy, Download, Trash2 } from "lucide-react";

import MainContent from "@/components/Layout/MainContent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/features/Templates/Header";
import { useTemplatesContext } from "@/contexts/TemplatesContext";
import { updatePromptTemplate, deletePromptTemplate } from "@/lib/storage";
import { formatRelativeTime } from "@/lib/helpers/time";
import type { PromptTemplate } from "@/types";
import { EntityCard, type EntityStatus } from "@/components/ui/EntityCard";
import { TemplateDetail } from "./TemplateDetail";
import { EmptyState } from "./EmptyState";

function parseVariableKeys(variablesJson: string | null | undefined): string[] {
  if (!variablesJson) return [];
  try {
    const parsed = JSON.parse(variablesJson);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function getVarCount(content: string): number {
  const matches = content.match(/\{\{[^}]+\}\}/g);
  return matches ? matches.length : 0;
}


function getTemplateStatus(template: PromptTemplate): EntityStatus {
  if (!template.name || !template.content) return "draft";
  const varCount = getVarCount(template.content);
  const variableKeys = parseVariableKeys(template.variables_json);
  if (varCount > 0 && variableKeys.length === 0) return "needs-config";
  return "ready";
}

function TemplatesPage() {
  const [search, setSearch] = useState("");
  const {
    templates,
    loading,
    loadTemplates,
    filter,
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

    if (filter === "archived") {
      result = result.filter((t) => t.archived_at != null);
    } else {
      result = result.filter((t) => t.archived_at == null);
      if (filter === "system" || filter === "user") {
        result = result.filter((t) => t.type === filter);
      } else if (filter === "starred") {
        result = result.filter((t) => t.is_pinned);
      } else if (filter === "recently_used") {
        result = [...result].sort((a, b) => (b.last_used_at ?? 0) - (a.last_used_at ?? 0));
      }
    }

    if (activeCollection) {
      result = result.filter(() => false);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          parseVariableKeys(t.variables_json).some((tag) =>
            tag.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }, [templates, filter, activeCollection, search]);

  const handleToggleStar = useCallback(
    async (template: PromptTemplate) => {
      if (!template.id) return;
      const newPinned = template.is_pinned ? 0 : 1;
      await updatePromptTemplate(template.id, { is_pinned: newPinned });
      await loadTemplates();
    },
    [loadTemplates]
  );

  const [templateToDelete, setTemplateToDelete] = useState<PromptTemplate | null>(null);

  const handleConfirmDelete = useCallback(async () => {
    if (!templateToDelete?.id) return;
    await deletePromptTemplate(templateToDelete.id);
    setTemplateToDelete(null);
    await loadTemplates();
  }, [templateToDelete, loadTemplates]);

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
          <EmptyState hasSearch={!!search} onCreateTemplate={onCreateTemplate} />
        ) : (
          <div className="space-y-1.5">
            {filtered.map((template) => {
              const variableKeys = parseVariableKeys(template.variables_json);
              const varCount =
                variableKeys.filter(Boolean).length ||
                getVarCount(template.content);
              const preview = template.content
                .split("\n")
                .slice(0, 2)
                .join(" ")
                .slice(0, 120);

              return (
                <EntityCard
                  key={template.id ?? template.name}
                  icon={FileCode}
                  status={getTemplateStatus(template)}
                  name={template.name}
                  description={preview}
                  onClick={() => handleSelectTemplate(template)}
                  starred={!!template.is_pinned}
                  onToggleStar={() => handleToggleStar(template)}
                  tags={[
                    { label: template.type === "system" ? "System" : "User" },
                    { label: `${varCount} vars`, icon: Variable },
                  ]}
                  metrics={[
                    { label: "Last used", value: template.last_used_at ? formatRelativeTime(template.last_used_at) : "Never" },
                  ]}
                  menuItems={[
                    { label: "Duplicate", icon: Copy, destructive: false, onClick: () => { } },
                    { label: "Export", icon: Download, destructive: false, onClick: () => { } },
                    { label: "Delete", icon: Trash2, destructive: true, onClick: () => setTemplateToDelete(template) },
                  ]}
                />
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainContent>
  );
}

export default TemplatesPage;
