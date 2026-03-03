interface VisualizerViewProps {
  agentName: string;
}

export function VisualizerView({ agentName }: VisualizerViewProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-border-light bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-text-main mb-2">Agent flow</h2>
          <p className="text-sm text-text-muted">
            Visualize your agent pipeline and execution flow.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-2.5">
        <span className="text-[10px] text-muted-foreground">
          Visualize mode · {agentName}
        </span>
      </div>
    </div>
  );
}
