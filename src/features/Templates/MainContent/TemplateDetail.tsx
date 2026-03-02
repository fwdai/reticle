import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Copy,
  Archive,
  Trash2,
  Variable,
  Clock,
  Activity,
  Calendar,
  Hash,
} from "lucide-react";

import Header from "@/components/Layout/Header";
import { EditableTitle } from "@/components/ui/EditableTitle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updatePromptTemplate,
  deletePromptTemplate,
  insertPromptTemplate,
} from "@/lib/storage";
import type { PromptTemplate } from "@/types";

function parseVariableKeys(variablesJson: string | null | undefined): string[] {
  if (!variablesJson) return [];
  try {
    const parsed = JSON.parse(variablesJson);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function formatTimestamp(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLastUsed(lastUsedAt: number | null | undefined): string {
  if (!lastUsedAt) return "Never";
  const diff = Date.now() - lastUsedAt;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} mins ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} hours ago`;
  return `${Math.floor(diff / 86400_000)} days ago`;
}

interface TemplateDetailProps {
  template: PromptTemplate;
  onBack: () => void;
  onSaved: () => void;
  onCreated?: (template: PromptTemplate) => void;
}

const TEMPLATE_TYPES = [
  { value: "user" as const, label: "User" },
  { value: "system" as const, label: "System" },
] as const;

const DEBOUNCE_MS = 800;

export function TemplateDetail({ template, onBack, onSaved, onCreated }: TemplateDetailProps) {
  const isNew = !template.id;
  const [name, setName] = useState(template.name || "");
  const [content, setContent] = useState(template.content || "");
  const [type, setType] = useState<"system" | "user">(template.type || "user");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(isNew);
  const skipNextAutoSaveRef = useRef(!isNew);

  useEffect(() => {
    setName(template.name || "");
    setContent(template.content || "");
    setType(template.type || "user");
    setHasChanges(!template.id);
  }, [template.id]);

  const variables = useMemo(() => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
  }, [content]);

  const highlightedContent = useMemo(() => {
    return content.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="text-primary font-semibold border-b border-primary/40 border-dashed">{{$1}}</span>'
    );
  }, [content]);

  const tags = useMemo(() => parseVariableKeys(template.variables_json), [template.variables_json]);

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(
      value.trim() !== (template.name || "").trim() ||
      content !== (template.content || "") ||
      type !== (template.type || "user")
    );
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(
      name.trim() !== (template.name || "").trim() ||
      value !== (template.content || "") ||
      type !== (template.type || "user")
    );
  };

  const handleTypeChange = (value: "system" | "user") => {
    setType(value);
    setHasChanges(
      name.trim() !== (template.name || "").trim() ||
      content !== (template.content || "") ||
      value !== (template.type || "user")
    );
  };

  const performSave = useCallback(async () => {
    if (isNew) {
      if (!name.trim()) return;
      setSaving(true);
      try {
        const id = await insertPromptTemplate({
          type,
          name: name.trim(),
          content,
          variables_json: JSON.stringify(variables),
        });
        setHasChanges(false);
        const newTemplate: PromptTemplate = {
          ...template,
          id,
          type,
          name: name.trim(),
          content,
          variables_json: JSON.stringify(variables),
        };
        onCreated?.(newTemplate);
      } catch (err) {
        console.error("Failed to create template:", err);
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        await updatePromptTemplate(template.id!, {
          type,
          name,
          content,
          variables_json: JSON.stringify(variables),
        });
        setHasChanges(false);
        onSaved();
      } catch (err) {
        console.error("Failed to save template:", err);
      } finally {
        setSaving(false);
      }
    }
  }, [isNew, template, type, name, content, variables, onSaved, onCreated]);

  useEffect(() => {
    if (!hasChanges) return;
    if (saving) return;
    if (isNew && !name.trim()) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    const timer = setTimeout(performSave, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [hasChanges, saving, isNew, name, performSave]);

  const handleDelete = useCallback(async () => {
    if (!template.id || !window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await deletePromptTemplate(template.id);
      onBack();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  }, [template.id, onBack]);

  const handleDuplicate = useCallback(async () => {
    try {
      await insertPromptTemplate({
        type,
        name: `${template.name} (copy)`,
        content,
        variables_json: JSON.stringify(variables),
      });
      onSaved();
    } catch (err) {
      console.error("Failed to duplicate template:", err);
    }
  }, [template.name, type, content, variables, onSaved]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <Header>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Templates
          </button>
          <div className="h-5 w-px bg-border-light" />
          <EditableTitle
            value={name}
            onChange={handleNameChange}
            revertValue={!isNew ? template.name ?? "" : undefined}
            placeholder={isNew ? "Name your template..." : "Template name..."}
            saveStatus={saving ? "saving" : hasChanges ? "unsaved" : "saved"}
            autoFocus={isNew}
          />
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-text-muted"
                onClick={handleDuplicate}
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-text-muted">
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </Header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        {/* Content Editor */}
        <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar p-6">
          <div className="flex flex-1 flex-col rounded-xl border border-border-light bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-light px-5 py-3 bg-slate-50">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Template Content
              </span>
              <div className="flex items-center gap-2">
                {variables.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    <Variable className="h-3 w-3" />
                    {variables.length} var{variables.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="relative overflow-y-auto min-h-[320px] flex-1">
              <div className="relative min-h-[320px]">
                {/* Sizing/overlay layer - variable highlighting */}
                <div
                  className="pointer-events-none p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-transparent [&_span]:text-primary [&_span]:font-semibold [&_span]:border-b [&_span]:border-primary/40 [&_span]:border-dashed"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="absolute font-mono inset-0 w-full min-h-[320px] resize-none overflow-y-auto p-5 text-sm leading-relaxed text-text-main placeholder:text-text-muted focus:outline-none bg-transparent"
                  spellCheck={false}
                  placeholder="Enter your prompt template. Use {{variable}} for placeholders."
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-text-muted" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-[280px] shrink-0 border-l border-border-light bg-white overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Template Type */}
          <div className="rounded-xl border border-border-light bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3 bg-slate-50">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Type
              </span>
            </div>
            <div className="p-4">
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Variables Panel */}
          <div className="rounded-xl border border-border-light bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3 bg-slate-50">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Variables
              </span>
              <span className="rounded-md font-mono bg-slate-100 px-2 py-0.5 text-[10px] text-text-muted">
                {variables.length}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {variables.length === 0 ? (
                <p className="text-xs text-text-muted">
                  No variables detected. Use{" "}
                  <code className="text-primary">{"{{name}}"}</code> syntax.
                </p>
              ) : (
                variables.map((v) => (
                  <div
                    key={v}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <Variable className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-text-main">{v}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Usage Panel */}
          <div className="rounded-xl border border-border-light bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-light px-4 py-3 bg-slate-50">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Usage
              </span>
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Activity className="h-3.5 w-3.5" />
                  Scenarios
                </div>
                <span className="font-mono text-sm font-semibold text-text-main">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Activity className="h-3.5 w-3.5" />
                  Runs (7d)
                </div>
                <span className="font-mono text-sm font-semibold text-text-main">0</span>
              </div>
              <div className="h-px bg-border-light" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  Last used
                </div>
                <span className="text-xs font-medium text-text-main">
                  {formatLastUsed(template.last_used_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  Created
                </div>
                <span className="text-xs font-medium text-text-main">
                  {formatTimestamp(template.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
