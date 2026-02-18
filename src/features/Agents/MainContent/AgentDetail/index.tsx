import { useState } from "react";
import {
  ArrowLeft,
  Share,
  Play,
  Save,
  Wrench,
  RotateCcw,
  ChevronDown,
  Search,
  MessageSquare,
  Sparkles,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs } from "@/components/ui/Tabs";
import TabPanel from "@/components/ui/Tabs/TabPanel";
import { TabTitle } from "@/components/ui/Tabs/TabTitle";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { cn } from "@/lib/utils";

import MainContent from "@/components/Layout/MainContent";
import Header from "@/components/Layout/Header";

const panelBase =
  "bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col";
const panelHeader =
  "h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center";
const panelTitle = "text-[10px] font-bold text-text-muted uppercase tracking-widest";

const availableTools = [
  { id: "web-search", name: "Web Search", description: "Search the internet for information" },
  { id: "code-exec", name: "Code Executor", description: "Execute Python or JS code snippets" },
  { id: "file-read", name: "File Reader", description: "Read and parse file contents" },
  { id: "api-call", name: "API Caller", description: "Make HTTP requests to external APIs" },
  { id: "db-query", name: "DB Query", description: "Run SQL queries against databases" },
  { id: "email-send", name: "Email Sender", description: "Send emails via SMTP or API" },
  { id: "slack-msg", name: "Slack Message", description: "Post messages to Slack channels" },
  { id: "scraper", name: "Web Scraper", description: "Extract structured data from URLs" },
];

interface RunRecord {
  id: string;
  status: "success" | "error" | "running";
  loops: number;
  tokens: string;
  cost: string;
  latency: string;
  timestamp: string;
}

const mockRuns: RunRecord[] = [
  { id: "run-1", status: "success", loops: 3, tokens: "2.3k", cost: "$0.014", latency: "4.2s", timestamp: "2h ago" },
  { id: "run-2", status: "error", loops: 5, tokens: "5.1k", cost: "$0.032", latency: "12.4s", timestamp: "5h ago" },
  { id: "run-3", status: "success", loops: 2, tokens: "1.1k", cost: "$0.007", latency: "2.8s", timestamp: "1d ago" },
  { id: "run-4", status: "success", loops: 4, tokens: "3.4k", cost: "$0.021", latency: "6.1s", timestamp: "2d ago" },
];

export interface AgentDetailAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  toolsCount: number;
  memoryEnabled: boolean;
}

interface AgentDetailProps {
  agent: AgentDetailAgent;
  onBack: () => void;
}

export function AgentDetail({ agent, onBack }: AgentDetailProps) {
  const isNew = agent.id === "new";
  const [agentName, setAgentName] = useState(agent.name);
  const [agentGoal, setAgentGoal] = useState(
    isNew ? "" : "Route and resolve customer inquiries across channels with context-aware responses. Escalate to human agents when confidence is below threshold."
  );
  const [systemInstructions, setSystemInstructions] = useState(
    isNew ? "" : "You are a customer support agent. Always greet the customer, identify the issue category, and attempt resolution before escalating."
  );
  const [selectedTools, setSelectedTools] = useState<string[]>(
    isNew ? [] : ["web-search", "api-call", "db-query", "email-send", "slack-msg"]
  );
  const [toolSearch, setToolSearch] = useState("");
  const [temperature, setTemperature] = useState([0.4]);
  const [topP, setTopP] = useState([0.95]);
  const [maxTokens, setMaxTokens] = useState([4096]);
  const [seed, setSeed] = useState("");
  const [maxIterations, setMaxIterations] = useState([10]);
  const [timeout, setTimeout] = useState([60]);
  const [retryPolicy, setRetryPolicy] = useState("exponential");
  const [toolCallStrategy, setToolCallStrategy] = useState("auto");
  const [memoryEnabled, setMemoryEnabled] = useState(agent.memoryEnabled);
  const [memorySource, setMemorySource] = useState("local");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("editor");

  const filteredTools = availableTools.filter(
    (t) =>
      t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const toggleTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    // TODO: implement
  };

  const handleRun = () => {
    // TODO: implement
  };

  return (
    <MainContent>
      <Header>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Agents
          </button>
          <div className="h-5 w-px bg-border-light" />
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder={isNew ? "Name your agent..." : "Agent name..."}
            className="text-sm font-bold bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/40 min-w-[12rem] focus:ring-0"
            autoFocus={isNew}
          />
        </div>
        <div className="flex items-center gap-2">
          <SegmentedSwitch
            options={[
              { value: "editor", label: "Editor" },
              { value: "visualizer", label: "Visualizer" },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v)}
          />
          <div className="h-6 w-px bg-border-light"></div>
          <button
            onClick={handleRun}
            className="h-9 px-5 rounded-xl gap-2 inline-flex items-center justify-center text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Play className="h-3.5 w-3.5" />
            Run Agent
          </button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 font-medium text-xs border-border-light"
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
          <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Share size={18} />
          </button>
        </div>
      </Header>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <Tabs activeIndex={activeTab} onActiveIndexChange={setActiveTab}>
          <TabPanel title="Agent Spec">
            <div className="flex flex-1 min-h-0 overflow-hidden -m-6">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                {/* Agent Goal */}
                <div className={panelBase}>
                  <div className={panelHeader}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className={panelTitle}>Agent Goal</span>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">{agentGoal.length} chars</span>
                  </div>
                  <div className="p-5">
                    <textarea
                      value={agentGoal}
                      onChange={(e) => setAgentGoal(e.target.value)}
                      placeholder="Describe the agent's primary objective and success criteria..."
                      className="min-h-[100px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 placeholder:text-text-muted/40"
                    />
                  </div>
                </div>

                {/* System Instructions */}
                <div className={panelBase}>
                  <div className={panelHeader}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
                      <span className={panelTitle}>System Instructions</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <textarea
                      value={systemInstructions}
                      onChange={(e) => setSystemInstructions(e.target.value)}
                      placeholder="System prompt that defines the agent's behavior, constraints, and personality..."
                      className="min-h-[120px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 placeholder:text-text-muted/40"
                    />
                  </div>
                </div>

                {/* Tools Selector */}
                <div className={panelBase}>
                  <div className={panelHeader}>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-text-muted" />
                      <span className={panelTitle}>Allowed Tools</span>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {selectedTools.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                      <Input
                        value={toolSearch}
                        onChange={(e) => setToolSearch(e.target.value)}
                        placeholder="Search tools..."
                        className="h-9 pl-9 text-xs border-border-light bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                      {filteredTools.map((tool) => {
                        const isSelected = selectedTools.includes(tool.id);
                        return (
                          <button
                            key={tool.id}
                            onClick={() => toggleTool(tool.id)}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                              isSelected
                                ? "border-primary/40 bg-primary/5"
                                : "border-border-light bg-white hover:border-slate-300"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 transition-colors",
                                isSelected ? "bg-primary/15 text-primary" : "bg-slate-100 text-text-muted"
                              )}
                            >
                              <Wrench className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-xs font-semibold truncate",
                                  isSelected ? "text-text-main" : "text-text-main/80"
                                )}
                              >
                                {tool.name}
                              </p>
                              <p className="text-[10px] text-text-muted line-clamp-1">{tool.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Loop Controls */}
                <div className={panelBase}>
                  <div className={panelHeader}>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-3.5 w-3.5 text-text-muted" />
                      <span className={panelTitle}>Loop Controls</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-text-main">Max Iterations</Label>
                          <span className="font-mono text-xs font-medium text-primary">{maxIterations[0]}</span>
                        </div>
                        <Slider
                          value={maxIterations}
                          onValueChange={setMaxIterations}
                          max={50}
                          min={1}
                          step={1}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-text-main">Timeout (s)</Label>
                          <span className="font-mono text-xs font-medium text-primary">{timeout[0]}s</span>
                        </div>
                        <Slider
                          value={timeout}
                          onValueChange={setTimeout}
                          max={300}
                          min={5}
                          step={5}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-text-main">Retry Policy</Label>
                        <Select value={retryPolicy} onValueChange={setRetryPolicy}>
                          <SelectTrigger className="h-9 text-xs border-border-light">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No retry</SelectItem>
                            <SelectItem value="fixed">Fixed delay</SelectItem>
                            <SelectItem value="exponential">Exponential backoff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-text-main">Tool Call Strategy</Label>
                        <Select value={toolCallStrategy} onValueChange={setToolCallStrategy}>
                          <SelectTrigger className="h-9 text-xs border-border-light">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="forced">Forced</SelectItem>
                            <SelectItem value="restricted">Restricted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Memory */}
                <div className={panelBase}>
                  <div className={panelHeader}>
                    <div className="flex items-center gap-2">
                      <Brain className="h-3.5 w-3.5 text-text-muted" />
                      <span className={panelTitle}>Memory</span>
                    </div>
                    <button
                      role="switch"
                      aria-checked={memoryEnabled}
                      onClick={() => setMemoryEnabled(!memoryEnabled)}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        memoryEnabled ? "bg-primary" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          memoryEnabled ? "left-4" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                  {memoryEnabled && (
                    <div className="p-5 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-text-main">Memory Source</Label>
                        <Select value={memorySource} onValueChange={setMemorySource}>
                          <SelectTrigger className="h-9 text-xs border-border-light">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local Store</SelectItem>
                            <SelectItem value="file">File-based</SelectItem>
                            <SelectItem value="vector" disabled>
                              Vector DB (coming soon)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="rounded-lg border border-border-light bg-slate-50 p-3">
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          Memory allows the agent to persist context across runs. The agent can store
                          observations, user preferences, and prior decisions to improve subsequent
                          interactions.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right config panel */}
              <div className="w-[260px] flex-shrink-0 border-l border-border-light overflow-y-auto custom-scrollbar bg-slate-50 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-6">
                  Model & Params
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-text-main">Provider</Label>
                    <Select defaultValue="openai">
                      <SelectTrigger className="h-9 text-xs border-border-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-text-main">Model</Label>
                    <Select defaultValue="gpt-4.1">
                      <SelectTrigger className="h-9 text-xs border-border-light">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4.1">gpt-4.1</SelectItem>
                        <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                        <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                        <SelectItem value="claude-3.5">claude-3.5-sonnet</SelectItem>
                        <SelectItem value="claude-3-opus">claude-3-opus</SelectItem>
                        <SelectItem value="gemini-pro">gemini-1.5-pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-px bg-border-light" />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-text-main">Temperature</Label>
                      <span className="font-mono text-xs font-medium text-primary">
                        {temperature[0].toFixed(2)}
                      </span>
                    </div>
                    <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.01} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-text-main">Top P</Label>
                      <span className="font-mono text-xs font-medium text-primary">
                        {topP[0].toFixed(2)}
                      </span>
                    </div>
                    <Slider value={topP} onValueChange={setTopP} max={1} step={0.01} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-text-main">Max Tokens</Label>
                      <span className="font-mono text-xs font-medium text-primary">{maxTokens[0]}</span>
                    </div>
                    <Slider value={maxTokens} onValueChange={setMaxTokens} max={16384} step={128} />
                  </div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex w-full items-center justify-between border-t border-border-light pt-5 text-[10px] font-semibold tracking-widest text-text-muted hover:text-text-main transition-colors"
                  >
                    ADVANCED
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")}
                    />
                  </button>
                  {showAdvanced && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-text-main">Seed</Label>
                        <Input
                          value={seed}
                          onChange={(e) => setSeed(e.target.value)}
                          placeholder="Optional seed..."
                          className="h-9 text-xs border-border-light bg-white"
                        />
                      </div>
                    </div>
                  )}
                  <div className="h-px bg-border-light" />
                  <div>
                    <h4 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase mb-3">
                      Scratchpad
                    </h4>
                    <div className="rounded-lg border border-border-light bg-white p-3 min-h-[80px]">
                      <p className="text-[11px] text-text-muted/60 italic">
                        Internal reasoning will appear here during runs...
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase mb-3">
                      Conversation State
                    </h4>
                    <div className="rounded-lg border border-border-light bg-white p-3 min-h-[60px]">
                      <p className="text-[11px] text-text-muted/60 italic">
                        No messages yet. Run the agent to see conversation state.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel title={<TabTitle label="Runs" count={mockRuns.length} />}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-2">
                {mockRuns.map((run) => (
                  <div
                    key={run.id}
                    className={cn(
                      "group rounded-xl border border-border-light bg-white p-4 cursor-pointer hover:border-slate-300 transition-colors",
                      run.status === "running" && "border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                          run.status === "success" && "bg-green-100 text-green-600",
                          run.status === "error" && "bg-red-100 text-red-600",
                          run.status === "running" && "bg-primary/10 text-primary"
                        )}
                      >
                        {run.status === "success" && <CheckCircle2 className="h-4 w-4" />}
                        {run.status === "error" && <XCircle className="h-4 w-4" />}
                        {run.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-text-main font-mono">
                            {run.id}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wide",
                              run.status === "success" && "text-green-600",
                              run.status === "error" && "text-red-600",
                              run.status === "running" && "text-primary"
                            )}
                          >
                            {run.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted">{run.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Loops
                          </span>
                          <span className="text-xs font-mono text-text-main">{run.loops}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Tokens
                          </span>
                          <span className="text-xs font-mono text-text-main">{run.tokens}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Cost
                          </span>
                          <span className="text-xs font-mono text-primary">{run.cost}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                            Latency
                          </span>
                          <span className="text-xs font-mono text-text-main">{run.latency}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                          <ExternalLink className="h-3 w-3" />
                          Trace
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                          <BarChart3 className="h-3 w-3" />
                          Compare
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </MainContent>
  );
}
