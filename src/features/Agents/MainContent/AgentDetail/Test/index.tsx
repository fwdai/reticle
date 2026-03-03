import { useAgentContext } from "@/contexts/AgentContext";

interface TestViewProps {
  agentName: string;
}

export function TestView({ agentName }: TestViewProps) {
  const { execution, isRunning } = useAgentContext();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-border-light bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-text-main mb-2">Test execution</h2>
          <p className="text-sm text-text-muted mb-6">
            Run your agent with a task input. Use the prompt in the runtime panel to execute.
          </p>
          {execution.steps.length > 0 && (
            <div className="rounded-lg border border-border-light bg-slate-50 p-4 text-sm">
              <div className="font-medium text-text-main mb-2">Last execution</div>
              <p className="text-text-muted text-xs">
                {execution.steps.length} step(s) · Status: {execution.status}
              </p>
            </div>
          )}
          {isRunning && (
            <p className="text-sm text-primary font-medium">Running…</p>
          )}
          {execution.steps.length === 0 && !isRunning && (
            <p className="text-sm text-text-muted italic">No runs yet.</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-2.5">
        <span className="text-[10px] text-muted-foreground">
          Test mode · {agentName}
        </span>
      </div>
    </div>
  );
}
