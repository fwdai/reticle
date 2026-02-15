import { Layers, CheckCircle2, Timer, Hash, Coins } from "lucide-react";
import { MetricPill } from "./MetricPill";
import { MiniTag } from "./MiniTag";

export function MetricsBar() {
  return (
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
  );
}
