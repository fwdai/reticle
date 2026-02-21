import { useContext, useState } from "react";
import { StudioContext } from "@/contexts/StudioContext";
import { calculateRequestCost } from "@/lib/modelPricing";
import { formatTokens, formatCost } from "@/lib/helpers/format";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import { CopyButton } from "@/components/ui/CopyButton";
import MarkdownPreview from "./MarkdownPreview";
import RawJsonView from "./RawJsonView";

export type ResponseViewMode = "text" | "raw";

function Response() {
  const [viewMode, setViewMode] = useState<ResponseViewMode>("text");
  const context = useContext(StudioContext);

  if (!context) {
    return null;
  }

  const { isLoading, response } = context.studioState;
  const { currentScenario } = context.studioState;

  const copyText =
    response &&
    (viewMode === "raw"
      ? JSON.stringify(response, null, 2)
      : response.text ?? response.error ?? "");

  const formatLatency = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const cost = (() => {
    const usage = response?.usage;
    if (!usage || (!usage.promptTokens && !usage.completionTokens && !usage.totalTokens)) return null;
    const provider = currentScenario?.configuration?.provider;
    const model = currentScenario?.configuration?.model;
    if (!provider || !model) return null;
    const inputTokens = usage.promptTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.8) : 0);
    const outputTokens = usage.completionTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.2) : 0);
    return calculateRequestCost(provider, model, { inputTokens, outputTokens });
  })();

  const isStandby = !response && !isLoading;
  const isIdle = isStandby || isLoading;
  const statusColor = response?.error ? 'bg-red-500' : isIdle ? 'bg-gray-400' : 'bg-green-500';
  const statusCode = response?.error ? 'ERROR' : isLoading ? '...' : isStandby ? '...' : '200 OK';

  return (
    <section className="h-full flex flex-col rounded-b-xl">
      <div className="h-11 border-b border-border-light flex items-center justify-between px-6 bg-sidebar-light/40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className={`size-2 ${statusColor} rounded-full ${isLoading ? 'animate-pulse-subtle' : ''}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">
              Response Console
            </span>
          </div>
          <div className="flex items-center gap-6">
            {response && (
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                  Status
                </span>
                <span className={`text-[11px] font-bold leading-none uppercase ${response?.error ? 'text-red-600' : isStandby ? 'text-text-muted' : 'text-green-600'}`}>
                  {statusCode}
                </span>
              </div>
            )}
            {response?.latency !== undefined && (
              <>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                    Latency
                  </span>
                  <span className="text-[11px] font-bold text-text-main leading-none">
                    {formatLatency(response.latency)}
                  </span>
                </div>
              </>
            )}
            {response?.usage && (
              <>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                    Usage
                  </span>
                  <span className="text-[11px] font-bold text-text-main leading-none">
                    {formatTokens(response?.usage?.totalTokens)}
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                    Cost
                  </span>
                  <span className="text-[11px] font-bold text-text-main leading-none">
                    {formatCost(cost)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        {response && (
          <div className="flex items-center gap-4">
            <CopyButton text={copyText ?? ""} />
            <div className="h-5 w-px bg-border-light"></div>
            <SegmentedSwitch<ResponseViewMode>
              options={[
                { value: "text", label: "Text" },
                { value: "raw", label: "Raw JSON" },
              ]}
              value={viewMode}
              onChange={setViewMode}
              size="compact"
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white text-sm text-text-main rounded-b-xl">
        {isLoading && !response?.text ? (
          <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-muted text-sm">Generating response...</p>
            </div>
          </div>
        ) : response ? (
          viewMode === "raw" ? (
            <RawJsonView response={response} />
          ) : response.error ? (
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-red-800 font-bold mb-2">Error</h3>
                <p className="text-red-700">{response.error}</p>
              </div>
            </div>
          ) : response.text ? (
            <div className="max-w-4xl mx-auto">
              <MarkdownPreview content={response.text} />
              {isLoading && (
                <span className="inline-block w-2 h-4 ml-0.5 -mb-1 bg-primary animate-pulse" />
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
              <p className="text-text-muted text-sm">No response text.</p>
            </div>
          )
        ) : (
          <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
            <p className="text-text-muted text-sm">No response yet. Click Run to generate a response.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Response;
