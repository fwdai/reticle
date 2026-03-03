import { useContext } from "react";
import { StudioContext } from "@/contexts/StudioContext";

export default function Test() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("Test must be used within a StudioProvider");
  }

  const { studioState } = context;
  const { currentScenario, response, isLoading } = studioState;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-100">
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-border-light bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-text-main mb-2">Test execution</h2>
          <p className="text-sm text-text-muted mb-6">
            Run your scenario to see results here. Use the Run button in the header to execute.
          </p>
          {response && (
            <div className="rounded-lg border border-border-light bg-slate-50 p-4 text-sm">
              <div className="font-medium text-text-main mb-2">Last response</div>
              {response.error ? (
                <p className="text-destructive">{response.error}</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words text-text-muted font-mono text-xs">
                  {response.text?.slice(0, 500)}
                  {response.text && response.text.length > 500 ? "…" : ""}
                </pre>
              )}
            </div>
          )}
          {isLoading && (
            <p className="text-sm text-primary font-medium">Running…</p>
          )}
          {!response && !isLoading && (
            <p className="text-sm text-text-muted italic">No runs yet.</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-2.5">
        <span className="text-[10px] text-muted-foreground">
          Test mode · {currentScenario.name}
        </span>
      </div>
    </div>
  );
}
