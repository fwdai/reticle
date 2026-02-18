import { useState } from "react";
import {
  ArrowLeft, Play, Save, Zap, Settings, Brain, Wrench, RotateCcw,
  ChevronDown, ChevronRight, Plus, Search, X, Clock, DollarSign,
  Timer, Hash, Eye, MessageSquare, Sparkles, ExternalLink,
  AlertCircle, CheckCircle2, XCircle, Loader2, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AgentStudioProps {
  agentId?: string;
  onBack: () => void;
}

// Mock tools available
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

export function AgentStudio({ agentId, onBack }: AgentStudioProps) {
  const isEditing = !!agentId;

  const [agentName, setAgentName] = useState(isEditing ? "Customer Support Agent" : "");
  const [agentGoal, setAgentGoal] = useState(
    isEditing
      ? "Route and resolve customer inquiries across channels with context-aware responses. Escalate to human agents when confidence is below threshold."
      : ""
  );
  const [systemInstructions, setSystemInstructions] = useState(
    isEditing
      ? "You are a customer support agent. Always greet the customer, identify the issue category, and attempt resolution before escalating."
      : ""
  );
  const [selectedTools, setSelectedTools] = useState<string[]>(
    isEditing ? ["web-search", "api-call", "db-query", "email-send", "slack-msg"] : []
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
  const [memoryEnabled, setMemoryEnabled] = useState(isEditing);
  const [memorySource, setMemorySource] = useState("local");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<"config" | "runs">("config");
  const [liveTokens, setLiveTokens] = useState(0);

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

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Studio Header */}
      <div className="flex items-center justify-between px-6 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Agent name..."
              className="text-lg font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 w-full"
            />
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {isEditing ? "Editing Agent" : "New Agent"}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[10px] text-muted-foreground">Draft</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {liveTokens > 0 && (
            <div className="flex items-center gap-2 mr-3 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
              <Hash className="h-3 w-3 text-accent" />
              <span className="font-mono text-xs font-semibold text-accent">{liveTokens.toLocaleString()} tokens</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="h-9 gap-2 font-medium text-xs">
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2 btn-glow bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-5"
          >
            <Play className="h-3.5 w-3.5" />
            Run Agent
          </Button>
        </div>
      </div>

      {/* Studio Tabs */}
      <div className="flex border-b border-border bg-panel px-6">
        {(["config", "runs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveStudioTab(tab)}
            className={cn("editor-tab", activeStudioTab === tab && "active")}
          >
            {tab === "config" ? "Configuration" : "Run History"}
            {tab === "runs" && mockRuns.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent leading-none">
                {mockRuns.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeStudioTab === "config" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Main editor */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">
            {/* Agent Goal */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="panel-title">Agent Goal</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {agentGoal.length} chars
                </span>
              </div>
              <div className="p-5">
                <Textarea
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  placeholder="Describe the agent's primary objective and success criteria..."
                  className="min-h-[100px] resize-none border-0 bg-transparent text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* System Instructions */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="panel-title">System Instructions</span>
                </div>
              </div>
              <div className="p-5">
                <Textarea
                  value={systemInstructions}
                  onChange={(e) => setSystemInstructions(e.target.value)}
                  placeholder="System prompt that defines the agent's behavior, constraints, and personality..."
                  className="min-h-[120px] resize-none border-0 bg-transparent text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>

            {/* Tools Selector */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="panel-title">Allowed Tools</span>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    {selectedTools.length}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="h-9 pl-9 text-xs bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto scrollbar-thin">
                  {filteredTools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                          isSelected
                            ? "border-accent/40 bg-accent/5"
                            : "border-border bg-background hover:border-muted-foreground/30"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg mt-0.5 transition-colors",
                            isSelected ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Wrench className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-semibold truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                            {tool.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{tool.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Loop Controls */}
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="panel-title">Loop Controls</span>
                </div>
              </div>
              <div className="p-5 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Max Iterations</label>
                      <span className="font-mono text-xs font-medium text-accent">{maxIterations[0]}</span>
                    </div>
                    <Slider
                      value={maxIterations}
                      onValueChange={setMaxIterations}
                      max={50}
                      min={1}
                      step={1}
                      className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-glow-sm [&_.bg-primary]:bg-accent"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">Timeout (s)</label>
                      <span className="font-mono text-xs font-medium text-accent">{timeout[0]}s</span>
                    </div>
                    <Slider
                      value={timeout}
                      onValueChange={setTimeout}
                      max={300}
                      min={5}
                      step={5}
                      className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-glow-sm [&_.bg-primary]:bg-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Retry Policy</label>
                    <Select value={retryPolicy} onValueChange={setRetryPolicy}>
                      <SelectTrigger className="h-9 text-xs">
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
                    <label className="text-xs font-semibold text-foreground">Tool Call Strategy</label>
                    <Select value={toolCallStrategy} onValueChange={setToolCallStrategy}>
                      <SelectTrigger className="h-9 text-xs">
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
            <div className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="panel-title">Memory</span>
                </div>
                <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
              </div>
              {memoryEnabled && (
                <div className="p-5 space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Memory Source</label>
                    <Select value={memorySource} onValueChange={setMemorySource}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Store</SelectItem>
                        <SelectItem value="file">File-based</SelectItem>
                        <SelectItem value="vector" disabled>Vector DB (coming soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Memory allows the agent to persist context across runs. The agent can store observations,
                      user preferences, and prior decisions to improve subsequent interactions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right config panel */}
          <div className="w-[260px] flex-shrink-0 border-l border-border overflow-y-auto scrollbar-thin bg-panel p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-6">
              Model & Params
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Provider</label>
                <Select defaultValue="openai">
                  <SelectTrigger className="h-9 text-xs">
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
                <label className="text-xs font-semibold text-foreground">Model</label>
                <Select defaultValue="gpt-4.1">
                  <SelectTrigger className="h-9 text-xs">
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

              <div className="h-px bg-border" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Temperature</label>
                  <span className="font-mono text-xs font-medium text-accent">{temperature[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={2}
                  step={0.01}
                  className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-glow-sm [&_.bg-primary]:bg-accent"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Top P</label>
                  <span className="font-mono text-xs font-medium text-accent">{topP[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={topP}
                  onValueChange={setTopP}
                  max={1}
                  step={0.01}
                  className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-glow-sm [&_.bg-primary]:bg-accent"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Max Tokens</label>
                  <span className="font-mono text-xs font-medium text-accent">{maxTokens[0]}</span>
                </div>
                <Slider
                  value={maxTokens}
                  onValueChange={setMaxTokens}
                  max={16384}
                  step={128}
                  className="[&_[role=slider]]:bg-accent [&_[role=slider]]:border-accent [&_[role=slider]]:shadow-glow-sm [&_.bg-primary]:bg-accent"
                />
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between border-t border-border pt-5 text-[10px] font-semibold tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                ADVANCED
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")} />
              </button>

              {showAdvanced && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Seed</label>
                    <Input
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Optional seed..."
                      className="h-9 text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              )}

              <div className="h-px bg-border" />

              {/* Scratchpad */}
              <div>
                <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Scratchpad</h4>
                <div className="rounded-lg border border-border bg-background p-3 min-h-[80px]">
                  <p className="text-[11px] text-muted-foreground/60 italic">
                    Internal reasoning will appear here during runs...
                  </p>
                </div>
              </div>

              {/* Conversation State */}
              <div>
                <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Conversation State</h4>
                <div className="rounded-lg border border-border bg-background p-3 min-h-[60px]">
                  <p className="text-[11px] text-muted-foreground/60 italic">
                    No messages yet. Run the agent to see conversation state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Run History Tab */
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="space-y-2">
            {mockRuns.map((run, i) => (
              <div
                key={run.id}
                className={cn(
                  "group card-hover rounded-xl border border-border bg-card p-4 cursor-pointer",
                  run.status === "running" && "border-accent/30"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                      run.status === "success" && "bg-success/10 text-success",
                      run.status === "error" && "bg-destructive/10 text-destructive",
                      run.status === "running" && "bg-accent/10 text-accent"
                    )}
                  >
                    {run.status === "success" && <CheckCircle2 className="h-4 w-4" />}
                    {run.status === "error" && <XCircle className="h-4 w-4" />}
                    {run.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>

                  {/* Run info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground font-mono">{run.id}</span>
                      <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wide",
                        run.status === "success" && "text-success",
                        run.status === "error" && "text-destructive",
                        run.status === "running" && "text-accent"
                      )}>
                        {run.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{run.timestamp}</span>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6">
                    <div className="metric">
                      <span className="metric-label">Loops</span>
                      <span className="metric-value text-xs font-mono">{run.loops}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Tokens</span>
                      <span className="metric-value text-xs font-mono">{run.tokens}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Cost</span>
                      <span className="metric-value text-xs font-mono text-accent">{run.cost}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Latency</span>
                      <span className="metric-value text-xs font-mono">{run.latency}</span>
                    </div>
                  </div>

                  {/* Actions */}
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
      )}
    </div>
  );
}
