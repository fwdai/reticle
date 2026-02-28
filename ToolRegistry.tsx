import { useState } from "react";
import {
  Plus, Search, Wrench, Trash2, Copy, ArrowLeft, Braces, Terminal,
  ChevronDown, ChevronRight, Pencil, MoreHorizontal, Tag, Clock,
  Zap, Filter,
} from "lucide-react";
import { Sidebar, SidebarSection, SidebarItem } from "@/components/layout/Sidebar";
import { MainContent, ContentHeader, ContentBody } from "@/components/layout/MainContent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface ToolParam {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
}

interface GlobalTool {
  id: string;
  name: string;
  description: string;
  category: string;
  params: ToolParam[];
  mockOutput: string;
  mockMode: "json" | "code";
  usedBy: number;
  updatedAt: string;
}

const PARAM_TYPES = ["string", "number", "boolean", "object", "array"] as const;

const CATEGORIES = ["All", "Data", "Communication", "DevOps", "Search", "Custom"];

/* ── Seed Data ── */
const SEED_TOOLS: GlobalTool[] = [
  {
    id: "1", name: "search_knowledge_base", description: "Search internal knowledge base for relevant documents and return matching results with relevance scores.",
    category: "Search", params: [
      { id: "p1", name: "query", type: "string", description: "Search query string", required: true },
      { id: "p2", name: "max_results", type: "number", description: "Maximum results to return", required: false },
      { id: "p3", name: "filters", type: "object", description: "Optional filter criteria", required: false },
    ],
    mockOutput: '{\n  "results": [\n    { "title": "Doc 1", "score": 0.95 }\n  ],\n  "total": 1\n}',
    mockMode: "json", usedBy: 4, updatedAt: "2 hours ago",
  },
  {
    id: "2", name: "send_notification", description: "Send a notification to a user or channel via the configured messaging provider.",
    category: "Communication", params: [
      { id: "p4", name: "channel", type: "string", description: "Target channel or user ID", required: true },
      { id: "p5", name: "message", type: "string", description: "Notification body", required: true },
      { id: "p6", name: "priority", type: "string", description: "Priority level: low, normal, high", required: false },
    ],
    mockOutput: '{ "sent": true, "messageId": "msg_abc123" }',
    mockMode: "json", usedBy: 3, updatedAt: "1 day ago",
  },
  {
    id: "3", name: "query_database", description: "Execute a read-only SQL query against the connected database and return results.",
    category: "Data", params: [
      { id: "p7", name: "sql", type: "string", description: "SQL query to execute", required: true },
      { id: "p8", name: "params", type: "array", description: "Parameterized query values", required: false },
    ],
    mockOutput: '{ "rows": [], "rowCount": 0 }',
    mockMode: "json", usedBy: 6, updatedAt: "3 hours ago",
  },
  {
    id: "4", name: "deploy_service", description: "Trigger a deployment pipeline for the specified service and environment.",
    category: "DevOps", params: [
      { id: "p9", name: "service", type: "string", description: "Service name", required: true },
      { id: "p10", name: "environment", type: "string", description: "Target environment", required: true },
      { id: "p11", name: "version", type: "string", description: "Version tag to deploy", required: false },
    ],
    mockOutput: '{ "deploymentId": "dep_xyz", "status": "queued" }',
    mockMode: "json", usedBy: 2, updatedAt: "5 days ago",
  },
  {
    id: "5", name: "fetch_webpage", description: "Fetch and parse a webpage URL, returning structured content and metadata.",
    category: "Search", params: [
      { id: "p12", name: "url", type: "string", description: "URL to fetch", required: true },
      { id: "p13", name: "extract_text", type: "boolean", description: "Extract plain text only", required: false },
    ],
    mockOutput: '{ "title": "Page Title", "content": "...", "status": 200 }',
    mockMode: "json", usedBy: 5, updatedAt: "12 hours ago",
  },
];

function createEmptyTool(): GlobalTool {
  return {
    id: crypto.randomUUID(), name: "", description: "", category: "Custom",
    params: [], mockOutput: '{\n  "result": "success"\n}', mockMode: "json",
    usedBy: 0, updatedAt: "Just now",
  };
}

function createEmptyParam(): ToolParam {
  return { id: crypto.randomUUID(), name: "", type: "string", description: "", required: true };
}

/* ── Main Screen ── */
export function ToolsScreen() {
  const [tools, setTools] = useState<GlobalTool[]>(SEED_TOOLS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ params: true, output: true });

  const selectedTool = tools.find((t) => t.id === selectedId);

  const filtered = tools.filter((t) => {
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = cat === "All" ? tools.length : tools.filter((t) => t.category === cat).length;
    return acc;
  }, {});

  const addTool = () => {
    const newTool = createEmptyTool();
    setTools((prev) => [newTool, ...prev]);
    setSelectedId(newTool.id);
  };

  const updateTool = (id: string, updates: Partial<GlobalTool>) => {
    setTools((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTool = (id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addParam = (toolId: string) => {
    setTools((prev) => prev.map((t) => t.id === toolId ? { ...t, params: [...t.params, createEmptyParam()] } : t));
  };

  const updateParam = (toolId: string, paramId: string, updates: Partial<ToolParam>) => {
    setTools((prev) => prev.map((t) => t.id === toolId ? { ...t, params: t.params.map((p) => p.id === paramId ? { ...p, ...updates } : p) } : t));
  };

  const removeParam = (toolId: string, paramId: string) => {
    setTools((prev) => prev.map((t) => t.id === toolId ? { ...t, params: t.params.filter((p) => p.id !== paramId) } : t));
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToolSchema = (tool: GlobalTool) => {
    const schema = {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: Object.fromEntries(tool.params.map((p) => [p.name, { type: p.type, description: p.description }])),
          required: tool.params.filter((p) => p.required).map((p) => p.name),
        },
      },
    };
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  };

  return (
    <>
      <Sidebar
        title="Tool Library"
        headerAction={
          <Button size="sm" className="h-8 gap-1.5 btn-glow bg-accent text-accent-foreground hover:bg-accent/90 font-medium" onClick={addTool}>
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        }
      >
        <SidebarSection title="Categories">
          {CATEGORIES.map((cat) => (
            <SidebarItem
              key={cat}
              icon={cat === "All" ? Wrench : cat === "Data" ? Braces : cat === "Communication" ? Zap : cat === "DevOps" ? Terminal : cat === "Search" ? Search : Tag}
              label={cat}
              count={categoryCounts[cat]}
              active={activeCategory === cat}
              onClick={() => { setActiveCategory(cat); setSelectedId(null); }}
            />
          ))}
        </SidebarSection>
      </Sidebar>

      <MainContent>
        {!selectedTool ? (
          /* ── GRID VIEW ── */
          <>
            <ContentHeader
              title="Tool Library"
              badge={
                <span className="text-sm text-muted-foreground">
                  {tools.length} tools in registry
                </span>
              }
              actions={
                <Button size="sm" className="h-9 gap-2 btn-glow bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={addTool}>
                  <Plus className="h-3.5 w-3.5" />
                  New Tool
                </Button>
              }
            />
            <ContentBody>
              <div className="animate-fade-in">
                {/* Search bar */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tools by name or description..."
                      className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm input-glow focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-1 py-0.5">
                    {CATEGORIES.slice(0, 5).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                          activeCategory === cat ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tool Grid */}
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <Wrench className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mb-1 font-semibold text-foreground">No tools found</p>
                    <p className="mb-5 text-sm text-muted-foreground max-w-xs">
                      {searchQuery ? "Try a different search query." : "Create your first tool to get started."}
                    </p>
                    <Button size="sm" className="gap-1.5 btn-glow bg-accent text-accent-foreground hover:bg-accent/90" onClick={addTool}>
                      <Plus className="h-3.5 w-3.5" /> Create Tool
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((tool, i) => (
                      <div
                        key={tool.id}
                        onClick={() => setSelectedId(tool.id)}
                        className="group card-hover cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-soft"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:bg-accent/20">
                            <Wrench className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                              {tool.category}
                            </span>
                          </div>
                        </div>

                        <h3 className="mb-1.5 font-mono text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                          {tool.name || "untitled"}
                        </h3>
                        <p className="mb-4 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {tool.description || "No description"}
                        </p>

                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Braces className="h-3 w-3" />
                              {tool.params.length} params
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Zap className="h-3 w-3" />
                              {tool.usedBy} agents
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {tool.updatedAt}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ContentBody>
          </>
        ) : (
          /* ── DETAIL / EDITOR VIEW ── */
          <>
            <ContentHeader
              breadcrumbs={[
                { label: "Tool Library" },
                { label: selectedTool.name || "New Tool" },
              ]}
              badge={
                <span className="rounded-md bg-accent/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-accent">
                  {selectedTool.category.toUpperCase()}
                </span>
              }
              actions={
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => copyToolSchema(selectedTool)}>
                    <Copy className="h-3.5 w-3.5" /> Copy Schema
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeTool(selectedTool.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              }
            />
            <ContentBody>
              <div className="mx-auto max-w-3xl animate-fade-in">
                {/* Back */}
                <button onClick={() => setSelectedId(null)} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to library
                </button>

                {/* Identity */}
                <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Tool Definition</h2>
                      <p className="text-[11px] text-muted-foreground">Define the function signature agents will use to invoke this tool.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Function Name</label>
                      <input
                        type="text"
                        value={selectedTool.name}
                        onChange={(e) => updateTool(selectedTool.id, { name: e.target.value })}
                        placeholder="e.g. search_knowledge_base"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm input-glow focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                      <textarea
                        value={selectedTool.description}
                        onChange={(e) => updateTool(selectedTool.id, { description: e.target.value })}
                        placeholder="What does this tool do? Be specific — this is shown to the LLM."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm leading-relaxed input-glow focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                      <select
                        value={selectedTool.category}
                        onChange={(e) => updateTool(selectedTool.id, { category: e.target.value })}
                        className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium input-glow focus:outline-none transition-all"
                      >
                        {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parameters */}
                <div className="mb-6 rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                  <button
                    onClick={() => toggleSection("params")}
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections.params ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Braces className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">Parameters</span>
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">{selectedTool.params.length}</span>
                    </div>
                    <span onClick={(e) => { e.stopPropagation(); addParam(selectedTool.id); }} className="text-xs font-semibold text-accent hover:text-accent/80 cursor-pointer">
                      + Add
                    </span>
                  </button>
                  {expandedSections.params && (
                    <div className="border-t border-border p-5 space-y-3">
                      {selectedTool.params.length === 0 ? (
                        <div className="text-center py-8">
                          <Braces className="mx-auto mb-2 h-5 w-5 text-muted-foreground/40" />
                          <p className="mb-1 text-xs font-medium text-muted-foreground">No parameters defined</p>
                          <p className="mb-4 text-[11px] text-muted-foreground/70">Add parameters that agents will pass when calling this tool.</p>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => addParam(selectedTool.id)}>
                            <Plus className="h-3 w-3" /> Add Parameter
                          </Button>
                        </div>
                      ) : (
                        selectedTool.params.map((param) => (
                          <div key={param.id} className="group rounded-xl border border-border bg-background p-4 hover:border-accent/30 transition-all">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => updateParam(selectedTool.id, param.id, { name: e.target.value })}
                                placeholder="param_name"
                                className="w-[140px] rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs focus:outline-none focus:border-accent/50 transition-all"
                              />
                              <select
                                value={param.type}
                                onChange={(e) => updateParam(selectedTool.id, param.id, { type: e.target.value as ToolParam["type"] })}
                                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent/50 transition-all"
                              >
                                {PARAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <button
                                onClick={() => updateParam(selectedTool.id, param.id, { required: !param.required })}
                                className={cn(
                                  "rounded-lg border px-2.5 py-2 text-[10px] font-bold tracking-wide transition-all",
                                  param.required ? "border-accent/30 bg-accent/10 text-accent" : "border-border text-muted-foreground"
                                )}
                              >
                                {param.required ? "REQUIRED" : "OPTIONAL"}
                              </button>
                              <button
                                onClick={() => removeParam(selectedTool.id, param.id)}
                                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={param.description}
                              onChange={(e) => updateParam(selectedTool.id, param.id, { description: e.target.value })}
                              placeholder="Parameter description..."
                              className="mt-2.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground focus:outline-none focus:text-foreground focus:border-accent/50 transition-all"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Mock Output */}
                <div className="mb-6 rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
                  <button
                    onClick={() => toggleSection("output")}
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections.output ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      <Terminal className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">Mock Response</span>
                    </div>
                    <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateTool(selectedTool.id, { mockMode: "json" }); }}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                          selectedTool.mockMode === "json" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Braces className="h-2.5 w-2.5" /> JSON
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateTool(selectedTool.id, { mockMode: "code" }); }}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all",
                          selectedTool.mockMode === "code" ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Terminal className="h-2.5 w-2.5" /> CODE
                      </button>
                    </div>
                  </button>
                  {expandedSections.output && (
                    <div className="border-t border-border p-5">
                      <textarea
                        value={selectedTool.mockOutput}
                        onChange={(e) => updateTool(selectedTool.id, { mockOutput: e.target.value })}
                        spellCheck={false}
                        rows={8}
                        className="code-block w-full resize-none border border-border p-4 font-mono text-xs leading-relaxed focus:outline-none focus:border-accent/50 transition-all rounded-xl"
                        placeholder='{ "result": "..." }'
                      />
                    </div>
                  )}
                </div>

                {/* Usage Info */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Usage</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">{selectedTool.usedBy}</span>
                      <span className="text-xs text-muted-foreground">agents using this tool</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Updated {selectedTool.updatedAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ContentBody>
          </>
        )}
      </MainContent>
    </>
  );
}
