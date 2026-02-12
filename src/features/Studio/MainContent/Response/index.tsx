import { useContext } from "react";
import { Copy, Code } from "lucide-react";
import { StudioContext } from "@/contexts/StudioContext";

function Response() {
  const context = useContext(StudioContext);

  if (!context) {
    return null;
  }

  const { isLoading, response } = context.studioState;

  console.log('Response:', response);

  const handleCopy = () => {
    if (response?.text) {
      navigator.clipboard.writeText(response.text);
    }
  };

  const formatLatency = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTokens = () => {
    if (!response?.usage?.totalTokens) return '-';
    return `${response.usage.totalTokens} tokens`;
  };

  const statusColor = response?.error ? 'bg-red-500' : 'bg-green-500';
  const statusCode = response?.error ? 'ERROR' : isLoading ? '...' : '200 OK';

  return (
    <section className="h-full flex flex-col rounded-b-xl">
      <div className="h-11 border-b border-border-light flex items-center justify-between px-8 bg-sidebar-light/40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className={`size-2 ${statusColor} rounded-full ${isLoading ? 'animate-pulse' : ''}`}></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">
              Response Console
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Status
              </span>
              <span className={`text-[11px] font-mono font-bold leading-none uppercase ${response?.error ? 'text-red-600' : 'text-green-600'}`}>
                {statusCode}
              </span>
            </div>
            {response?.latency !== undefined && (
              <>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                    Latency
                  </span>
                  <span className="text-[11px] font-mono font-bold text-text-main leading-none">
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
                  <span className="text-[11px] font-mono font-bold text-text-main leading-none">
                    {formatTokens()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        {response && (
          <div className="flex items-center gap-4">
            <button className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1">
              <Code size={14} />
              RAW JSON
            </button>
            <button
              onClick={handleCopy}
              className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1">
              <Copy size={14} />
              COPY
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white font-mono text-sm leading-relaxed text-text-main rounded-b-xl">
        {isLoading ? (
          <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-muted text-sm">Generating response...</p>
            </div>
          </div>
        ) : response?.error ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-red-800 font-bold mb-2">Error</h3>
              <p className="text-red-700">{response.error}</p>
            </div>
          </div>
        ) : response?.text ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="whitespace-pre-wrap">{response.text}</div>
          </div>
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
