import { MetricsBar } from "./MetricsBar";
import { BottomBar } from "./BottomBar";
import { FlowCanvas } from "./FlowCanvas";

export default function Visualizer() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <MetricsBar />
      <FlowCanvas />
      <BottomBar />
    </div>
  );
}
