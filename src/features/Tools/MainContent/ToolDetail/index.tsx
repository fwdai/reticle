import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Trash2,
  Wrench,
  Braces,
  Terminal,
  ChevronDown,
  ChevronRight,
  Plus,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MainContent from "@/components/Layout/MainContent";
import LayoutHeader from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PARAM_TYPES, createEmptyParam } from "../../constants";
import type { RegistryTool, ToolParameter } from "../../types";

interface ToolDetailProps {
  tool: RegistryTool;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<RegistryTool>) => void;
  onDelete: (id: string) => void;
}

export function ToolDetail({ tool, onBack, onUpdate, onDelete }: ToolDetailProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    params: true,
    output: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addParam = () => {
    onUpdate(tool.id, { parameters: [...tool.parameters, createEmptyParam()] });
  };

  const updateParam = (paramId: string, updates: Partial<ToolParameter>) => {
    onUpdate(tool.id, {
      parameters: tool.parameters.map((p) =>
        p.id === paramId ? { ...p, ...updates } : p
      ),
    });
  };

  const removeParam = (paramId: string) => {
    onUpdate(tool.id, {
      parameters: tool.parameters.filter((p) => p.id !== paramId),
    });
  };

  const copyToolSchema = () => {
    const schema = {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(
            tool.parameters.map((p) => [
              p.name,
              { type: p.type, description: p.description },
            ])
          ),
          required: tool.parameters.filter((p) => p.required).map((p) => p.name),
        },
      },
    };
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  };

  const inputClass =
    "w-full rounded-lg border border-border-light bg-white px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all";

  return (
    <MainContent>
      {/* Header */}
      <LayoutHeader>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Tools
          </button>
          <div className="h-5 w-px bg-border-light" />
          <span className="text-sm font-semibold text-text-main truncate">
            {tool.name || "New Tool"}
          </span>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
            {tool.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs"
            onClick={copyToolSchema}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Schema
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(tool.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </LayoutHeader>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:px-6 bg-slate-50">
        <div className="mx-auto max-w-3xl">
          {/* Tool Definition */}
          <div className="mb-5 rounded-xl border border-border-light bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-0.5">
                  Tool Definition
                </h2>
                <p className="text-[11px] text-text-muted">
                  Define the function signature agents will use to invoke this tool.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Function Name
                </label>
                <input
                  type="text"
                  value={tool.name}
                  onChange={(e) => onUpdate(tool.id, { name: e.target.value })}
                  placeholder="e.g. search_knowledge_base"
                  className={cn(inputClass, "font-mono")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Description
                </label>
                <textarea
                  value={tool.description}
                  onChange={(e) => onUpdate(tool.id, { description: e.target.value })}
                  placeholder="What does this tool do? Be specific — this is shown to the LLM."
                  rows={3}
                  className={cn(inputClass, "resize-none leading-relaxed")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Category
                </label>
                <select
                  value={tool.category}
                  onChange={(e) => onUpdate(tool.id, { category: e.target.value })}
                  className={cn(inputClass, "w-auto font-medium")}
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="mb-5 rounded-xl border border-border-light bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("params")}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.params ? (
                  <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                )}
                <Braces className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-text-main">Parameters</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {tool.parameters.length}
                </span>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  addParam();
                }}
                className="text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer"
              >
                + Add
              </span>
            </button>

            {expandedSections.params && (
              <div className="border-t border-border-light p-5 space-y-3">
                {tool.parameters.length === 0 ? (
                  <div className="text-center py-8">
                    <Braces className="mx-auto mb-2 h-5 w-5 text-text-muted/40" />
                    <p className="mb-1 text-xs font-medium text-text-muted">
                      No parameters defined
                    </p>
                    <p className="mb-4 text-[11px] text-text-muted/70">
                      Add parameters that agents will pass when calling this tool.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={addParam}
                    >
                      <Plus className="h-3 w-3" />
                      Add Parameter
                    </Button>
                  </div>
                ) : (
                  tool.parameters.map((param) => (
                    <div
                      key={param.id}
                      className="group rounded-lg border border-border-light bg-slate-50 p-4 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) =>
                            updateParam(param.id, { name: e.target.value })
                          }
                          placeholder="param_name"
                          className="w-[140px] rounded-lg border border-border-light bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                        <select
                          value={param.type}
                          onChange={(e) =>
                            updateParam(param.id, {
                              type: e.target.value as ToolParameter["type"],
                            })
                          }
                          className="rounded-lg border border-border-light bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        >
                          {PARAM_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            updateParam(param.id, { required: !param.required })
                          }
                          className={cn(
                            "rounded-lg border px-2.5 py-2 text-[10px] font-bold tracking-wide transition-all",
                            param.required
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border-light text-text-muted"
                          )}
                        >
                          {param.required ? "REQUIRED" : "OPTIONAL"}
                        </button>
                        <button
                          onClick={() => removeParam(param.id)}
                          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) =>
                          updateParam(param.id, { description: e.target.value })
                        }
                        placeholder="Parameter description..."
                        className="mt-2.5 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-xs text-text-muted focus:outline-none focus:text-text-main focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Mock Response */}
          <div className="mb-5 rounded-xl border border-border-light bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection("output")}
              className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedSections.output ? (
                  <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                )}
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-text-main">
                  Mock Response
                </span>
              </div>
              <div className="flex items-center rounded-lg border border-border-light bg-slate-50 p-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(tool.id, { mockMode: "json" });
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                    tool.mockMode === "json"
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  <Braces className="h-2.5 w-2.5" />
                  JSON
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(tool.id, { mockMode: "code" });
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                    tool.mockMode === "code"
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  <Terminal className="h-2.5 w-2.5" />
                  CODE
                </button>
              </div>
            </button>

            {expandedSections.output && (
              <div className="border-t border-border-light p-5">
                <textarea
                  value={tool.mockResponse}
                  onChange={(e) =>
                    onUpdate(tool.id, { mockResponse: e.target.value })
                  }
                  spellCheck={false}
                  rows={8}
                  className="w-full resize-none rounded-lg border border-border-light bg-slate-50 p-4 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder='{ "result": "..." }'
                />
              </div>
            )}
          </div>

          {/* Usage */}
          <div className="rounded-xl border border-border-light bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
              Usage
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-text-main">
                  {tool.usedBy}
                </span>
                <span className="text-xs text-text-muted">
                  agents using this tool
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-text-muted" />
                <span className="text-xs text-text-muted">
                  Updated {tool.updatedAt}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
