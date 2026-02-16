import { useContext, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Wrench,
  Copy,
  ArrowLeft,
  Braces,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudioContext } from "@/contexts/StudioContext";
import type { Tool, ToolParameter } from "./types";
import { normalizeToolFromDb } from "./types";

const PARAM_TYPES = ["string", "number", "boolean", "object", "array"] as const;

const DEFAULT_MOCK = `{
  "result": "success",
  "data": {}
}`;

function createEmptyTool(): Tool {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    parameters: [],
    mockResponse: DEFAULT_MOCK,
    mockMode: "json",
  };
}

function createEmptyParam(): ToolParameter {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: true,
  };
}

const panelBase =
  "bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col";
const panelHeader =
  "h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center";
const panelTitle = "text-[10px] font-bold text-text-muted uppercase tracking-widest";
const inputBase =
  "w-full rounded-lg border border-border-light bg-white px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all";

export default function Tools() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("Tools must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const rawTools = studioState.currentScenario.tools ?? [];

  const tools: Tool[] = rawTools
    .map((t) => normalizeToolFromDb(t))
    .filter((t): t is Tool => t !== null);

  const setTools = useCallback(
    (updater: (prev: Tool[]) => Tool[]) => {
      setStudioState((prev) => {
        const currentTools = (prev.currentScenario.tools ?? [])
          .map((t) => normalizeToolFromDb(t))
          .filter((t): t is Tool => t !== null);
        const newTools = updater(currentTools);
        return {
          ...prev,
          currentScenario: {
            ...prev.currentScenario,
            tools: newTools,
          },
        };
      });
    },
    [setStudioState]
  );

  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    params: true,
    output: true,
  });

  const selectedTool = tools.find((t) => t.id === selectedToolId);

  const addTool = () => {
    const newTool = createEmptyTool();
    setTools((prev) => [...prev, newTool]);
    setSelectedToolId(newTool.id);
  };

  const updateTool = (id: string, updates: Partial<Tool>) => {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTool = (id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id));
    if (selectedToolId === id) setSelectedToolId(null);
  };

  const addParam = (toolId: string) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId ? { ...t, parameters: [...t.parameters, createEmptyParam()] } : t
      )
    );
  };

  const updateParam = (toolId: string, paramId: string, updates: Partial<ToolParameter>) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId
          ? {
              ...t,
              parameters: t.parameters.map((p) =>
                p.id === paramId ? { ...p, ...updates } : p
              ),
            }
          : t
      )
    );
  };

  const removeParam = (toolId: string, paramId: string) => {
    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId
          ? { ...t, parameters: t.parameters.filter((p) => p.id !== paramId) }
          : t
      )
    );
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToolSchema = (tool: Tool) => {
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

  // LIST VIEW
  if (!selectedTool) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className={panelBase}>
          <div className={panelHeader}>
            <span className={panelTitle}>Tool Definitions</span>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                {tools.length} TOOL{tools.length !== 1 ? "S" : ""}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={addTool}
              >
                <Plus className="h-3 w-3" />
                ADD TOOL
              </Button>
            </div>
          </div>

          {tools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <p className="mb-1 text-sm font-medium text-text-main">No tools configured</p>
              <p className="mb-5 max-w-[260px] text-xs text-text-muted">
                Define function calling tools for the LLM. Specify input schema and mock
                outputs to test tool calling behavior.
              </p>
              <Button
                size="sm"
                className="h-9 gap-1.5 font-medium px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm"
                onClick={addTool}
              >
                <Plus className="h-3.5 w-3.5" />
                Create First Tool
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {tools.map((tool) => (
                <ToolListItem
                  key={tool.id}
                  tool={tool}
                  onSelect={() => setSelectedToolId(tool.id)}
                  onRemove={() => removeTool(tool.id)}
                  onCopy={() => copyToolSchema(tool)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedToolId(null)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-light bg-white text-text-muted hover:text-text-main hover:border-primary/40 transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Wrench className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold text-text-main">
            {selectedTool.name || "Untitled Tool"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-text-muted hover:text-text-main"
            onClick={() => copyToolSchema(selectedTool)}
          >
            <Copy className="h-3 w-3" />
            Copy Schema
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-text-muted hover:text-destructive"
            onClick={() => removeTool(selectedTool.id)}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>

      {/* Identity */}
      <div className={panelBase}>
        <div className={panelHeader}>
          <span className={panelTitle}>Identity</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Function Name
            </label>
            <input
              type="text"
              value={selectedTool.name}
              onChange={(e) => updateTool(selectedTool.id, { name: e.target.value })}
              placeholder="e.g. get_weather, search_docs"
              className={cn(inputBase, "font-mono")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Description
            </label>
            <textarea
              value={selectedTool.description}
              onChange={(e) => updateTool(selectedTool.id, { description: e.target.value })}
              placeholder="Describe what this tool does. The LLM uses this to decide when to call it."
              rows={2}
              className={cn(inputBase, "resize-none leading-relaxed")}
            />
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className={panelBase}>
        <button
          onClick={() => toggleSection("params")}
          className={cn(panelHeader, "w-full cursor-pointer hover:bg-sidebar-light/50 transition-colors")}
        >
          <div className="flex items-center gap-2">
            {expandedSections.params ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
            )}
            <span className={panelTitle}>Input Parameters</span>
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {selectedTool.parameters.length}
            </span>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              addParam(selectedTool.id);
            }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            ADD
          </span>
        </button>

        {expandedSections.params && (
          <div className="p-4">
            {selectedTool.parameters.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Braces className="mb-2 h-5 w-5 text-text-muted/50" />
                <p className="mb-1 text-xs text-text-muted">No parameters defined</p>
                <p className="mb-4 text-[11px] text-text-muted/70">
                  Add input parameters this tool expects from the LLM
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => addParam(selectedTool.id)}
                >
                  <Plus className="h-3 w-3" />
                  Add Parameter
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTool.parameters.map((param) => (
                  <ParamRow
                    key={param.id}
                    param={param}
                    onUpdate={(updates) =>
                      updateParam(selectedTool.id, param.id, updates)
                    }
                    onRemove={() => removeParam(selectedTool.id, param.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mock Output */}
      <div className={panelBase}>
        <button
          onClick={() => toggleSection("output")}
          className={cn(panelHeader, "w-full cursor-pointer hover:bg-sidebar-light/50 transition-colors")}
        >
          <div className="flex items-center gap-2">
            {expandedSections.output ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
            )}
            <span className={panelTitle}>Tool Response Mock</span>
          </div>
          <div className="flex items-center rounded-lg border border-border-light bg-white p-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTool(selectedTool.id, { mockMode: "json" });
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                selectedTool.mockMode === "json"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <Braces className="h-3 w-3" />
              MOCK
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTool(selectedTool.id, { mockMode: "code" });
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                selectedTool.mockMode === "code"
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <Terminal className="h-3 w-3" />
              CODE
            </button>
          </div>
        </button>

        {expandedSections.output && (
          <div className="p-4">
            {selectedTool.mockMode === "json" ? (
              <>
                <textarea
                  value={selectedTool.mockResponse}
                  onChange={(e) =>
                    updateTool(selectedTool.id, { mockResponse: e.target.value })
                  }
                  spellCheck={false}
                  rows={8}
                  className={cn(
                    inputBase,
                    "font-mono text-[13px] leading-relaxed p-4 resize-none focus:border-primary/50"
                  )}
                  placeholder='{ "result": "..." }'
                />
                <p className="mt-2 text-[10px] tracking-wide text-text-muted">
                  THIS JSON WILL BE RETURNED WHEN THE LLM CALLS THIS TOOL DURING A TEST RUN
                </p>
              </>
            ) : (
              <>
                <textarea
                  value={selectedTool.mockResponse}
                  onChange={(e) =>
                    updateTool(selectedTool.id, { mockResponse: e.target.value })
                  }
                  spellCheck={false}
                  rows={10}
                  className={cn(
                    inputBase,
                    "font-mono text-[13px] leading-relaxed p-4 resize-none focus:border-primary/50"
                  )}
                  placeholder={`// Tool implementation\nasync function execute(params) {\n  // your code here\n  return { result: "..." };\n}`}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    COMING SOON
                  </span>
                  <p className="text-[10px] tracking-wide text-text-muted">
                    CODE MODE WILL EXECUTE JS SNIPPETS AS TOOL IMPLEMENTATIONS
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Schema Preview */}
      <div className={panelBase}>
        <div className={panelHeader}>
          <span className={panelTitle}>Generated Schema Preview</span>
          <button
            onClick={() => copyToolSchema(selectedTool)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted hover:text-text-main transition-colors"
          >
            <Copy className="h-3 w-3" />
            COPY
          </button>
        </div>
        <div className="p-4">
          <pre className="overflow-x-auto text-[12px] leading-relaxed font-mono p-4 rounded-lg bg-sidebar-light/30 border border-border-light">
            {JSON.stringify(
              {
                type: "function",
                function: {
                  name: selectedTool.name || "function_name",
                  description: selectedTool.description || "...",
                  parameters: {
                    type: "object",
                    properties: Object.fromEntries(
                      selectedTool.parameters.map((p) => [
                        p.name || "param",
                        { type: p.type, description: p.description },
                      ])
                    ),
                    required: selectedTool.parameters
                      .filter((p) => p.required)
                      .map((p) => p.name || "param"),
                  },
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ToolListItem({
  tool,
  onSelect,
  onRemove,
  onCopy,
}: {
  tool: Tool;
  onSelect: () => void;
  onRemove: () => void;
  onCopy: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className="group flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-sidebar-light/50 transition-all"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <Wrench className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-text-main truncate">
            {tool.name || "untitled"}
          </span>
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
            {tool.parameters.length} PARAM{tool.parameters.length !== 1 ? "S" : ""}
          </span>
          {tool.mockMode === "code" && (
            <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
              CODE
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted truncate">
          {tool.description || "No description"}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-main hover:bg-sidebar-light transition-all"
          title="Copy schema"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all"
          title="Delete tool"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <ChevronRight className="h-4 w-4 text-text-muted/50 group-hover:text-text-muted transition-colors" />
    </div>
  );
}

function ParamRow({
  param,
  onUpdate,
  onRemove,
}: {
  param: ToolParameter;
  onUpdate: (updates: Partial<ToolParameter>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="group rounded-xl border border-border-light bg-white p-3 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="text"
            value={param.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="param_name"
            className="w-[140px] rounded-lg border border-border-light bg-white px-3 py-2 font-mono text-xs focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all"
          />
          <select
            value={param.type}
            onChange={(e) => onUpdate({ type: e.target.value as ToolParameter["type"] })}
            className="rounded-lg border border-border-light bg-white px-3 py-2 text-xs font-medium text-text-main focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          >
            {PARAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => onUpdate({ required: !param.required })}
            className={cn(
              "rounded-lg border px-3 py-2 text-[10px] font-bold tracking-wide transition-all",
              param.required
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border-light bg-white text-text-muted hover:text-text-main"
            )}
          >
            {param.required ? "REQUIRED" : "OPTIONAL"}
          </button>
        </div>
        <button
          onClick={onRemove}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-text-muted hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="text"
        value={param.description}
        onChange={(e) => onUpdate({ description: e.target.value })}
        placeholder="Parameter description (helps the LLM understand usage)"
        className="mt-2 w-full rounded-lg border border-border-light bg-white px-3 py-2 text-xs text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:text-text-main transition-all"
      />
    </div>
  );
}
