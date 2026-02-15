import {
  MessageSquare,
  Settings2,
  Cpu,
  FileText,
  Wrench,
  Database,
  ArrowRight,
  Zap,
  Clock,
  Hash,
} from "lucide-react";
import { FlowNode, FlowConnector } from "./FlowNode";
import { MiniTag } from "./MiniTag";
import { ConfigChip } from "./ConfigChip";

export function FlowCanvas() {
  return (
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
              <div className="rounded-2xl border-2 border-accent/30 bg-card p-5 shadow-glow transition-all min-w-[260px]">
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
  );
}
