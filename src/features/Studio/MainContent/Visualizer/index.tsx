import {
  MessageSquare, Settings2, Cpu, FileText, Wrench, Database,
  Layers, ArrowRight, Zap, Clock, Coins, Hash, CheckCircle2, Timer
} from "lucide-react";
import { FlowNode, FlowConnector } from "./FlowNode";
import { cn } from "@/lib/utils";

interface MetricPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  variant?: "default" | "success" | "accent" | "warning";
}

function MetricPill({ icon: Icon, label, value, variant = "default" }: MetricPillProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
      variant === "default" && "border-border bg-card text-foreground",
      variant === "success" && "border-primary/20 bg-primary/5 text-primary",
      variant === "accent" && "border-accent/20 bg-accent/5 text-accent",
      variant === "warning" && "border-warning/20 bg-warning/5 text-warning",
    )}>
      <Icon className="h-3.5 w-3.5 opacity-60" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function MiniTag({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" | "muted" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
      variant === "default" && "bg-muted text-muted-foreground",
      variant === "accent" && "bg-accent/10 text-accent",
      variant === "muted" && "bg-muted/50 text-muted-foreground/60",
    )}>
      {children}
    </span>
  );
}

export default function Visualizer() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      {/* Top Metrics Bar */}
      <div className="flex items-center gap-3 border-b border-border bg-panel px-6 py-3 bg-slate-50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          Pipeline Overview
        </div>
        <div className="mx-3 h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <MetricPill icon={CheckCircle2} label="Status" value="200 OK" variant="success" />
          <MetricPill icon={Timer} label="Latency" value="1.24s" variant="accent" />
          <MetricPill icon={Hash} label="Tokens" value="452" />
          <MetricPill icon={Coins} label="Cost" value="$0.0031" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <MiniTag variant="accent">COMPLETED</MiniTag>
          <span className="text-[10px] text-muted-foreground">Run #1847</span>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex min-h-full items-start justify-center">
          <div className="flex flex-col items-center gap-0">

            {/* Row 1: Input Sources */}
            <div className="flex items-center gap-0">
              <FlowNode
                icon={MessageSquare}
                title="SYSTEM PROMPT"
                subtitle="Instructions"
                status="success"
              >
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    "You are a helpful assistant."
                  </p>
                  <div className="flex items-center gap-2">
                    <MiniTag>28 chars</MiniTag>
                    <MiniTag>~7 tokens</MiniTag>
                  </div>
                </div>
              </FlowNode>

              <FlowConnector direction="horizontal" status="success" animated length="medium" />

              <FlowNode
                icon={FileText}
                title="USER INPUT"
                subtitle="Query"
                status="success"
              >
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    "Build a clean UI with Tailwind CSS..."
                  </p>
                  <div className="flex items-center gap-2">
                    <MiniTag>142 chars</MiniTag>
                    <MiniTag>~38 tokens</MiniTag>
                  </div>
                </div>
              </FlowNode>

              <FlowConnector direction="horizontal" status="idle" length="medium" />

              <FlowNode
                icon={Database}
                title="CONTEXT"
                subtitle="RAG Documents"
                status="idle"
              >
                <div className="text-[11px] text-muted-foreground/50 italic">
                  No documents attached
                </div>
              </FlowNode>
            </div>

            {/* Vertical Connector */}
            <div className="flex items-center justify-center">
              <FlowConnector direction="vertical" status="success" animated length="medium" label="merge" />
            </div>

            {/* Row 2: Processing */}
            <div className="flex items-center gap-0">
              <FlowNode
                icon={Wrench}
                title="TOOLS"
                subtitle="Function Calling"
                status="idle"
                className="w-[180px]"
              >
                <div className="text-[11px] text-muted-foreground/50 italic">
                  No tools configured
                </div>
              </FlowNode>

              <FlowConnector direction="horizontal" status="idle" length="medium" />

              {/* Central Model Node - larger and emphasized */}
              <div className="relative">
                <div className={cn(
                  "rounded-2xl border-2 border-accent/30 bg-card p-5 shadow-glow transition-all",
                  "min-w-[260px]"
                )}>
                  {/* Glow ring behind */}
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-accent/5 blur-xl" />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">GPT-4o</div>
                      <div className="text-[10px] text-muted-foreground">gpt-4o-2024-05-13</div>
                    </div>
                    <div className="ml-auto">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <ConfigChip label="Temp" value="0.7" />
                    <ConfigChip label="Top P" value="1.0" />
                    <ConfigChip label="Max" value="2048" />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Settings2 className="h-3 w-3" />
                    <span>OpenAI · Production</span>
                  </div>
                </div>
              </div>

              <FlowConnector direction="horizontal" status="idle" length="medium" />

              <FlowNode
                icon={Zap}
                title="GUARDRAILS"
                subtitle="Safety Filters"
                status="pending"
                className="w-[180px]"
              >
                <div className="text-[11px] text-muted-foreground/50 italic">
                  Not configured
                </div>
              </FlowNode>
            </div>

            {/* Vertical Connector */}
            <div className="flex items-center justify-center">
              <FlowConnector direction="vertical" status="success" animated length="medium" label="inference" />
            </div>

            {/* Row 3: Output */}
            <FlowNode
              icon={ArrowRight}
              title="RESPONSE"
              subtitle="Completion"
              status="success"
              className="w-[500px]"
            >
              <div className="space-y-3">
                <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-3">
                  "To build a clean UI with Tailwind CSS, you should follow the utility-first principle while maintaining a structured layout..."
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <MiniTag variant="accent">452 tokens</MiniTag>
                  <MiniTag>finish: stop</MiniTag>
                  <MiniTag>1 choice</MiniTag>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    1.24s total
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    TTFB 0.31s
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Prompt: 45 · Completion: 407
                  </span>
                </div>
              </div>
            </FlowNode>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t border-border bg-panel px-6 py-2.5">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>Pipeline: <span className="font-semibold text-foreground">5 nodes</span></span>
          <span className="text-border">·</span>
          <span>Active: <span className="font-semibold text-primary">3</span></span>
          <span className="text-border">·</span>
          <span>Idle: <span className="font-semibold text-muted-foreground">2</span></span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <button className="hover:text-foreground transition-colors">Zoom to fit</button>
          <span className="text-border">·</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}

function ConfigChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted/50 px-2 py-1.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
