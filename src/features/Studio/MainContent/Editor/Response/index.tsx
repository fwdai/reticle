import { useContext } from "react";
import { Copy, Code } from "lucide-react";
import { StudioContext } from "@/contexts/StudioContext";
import { calculateRequestCost } from "@/lib/modelPricing";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // For GitHub Flavored Markdown

function Response() {
  const context = useContext(StudioContext);

  if (!context) {
    return null;
  }

  const { isLoading, response } = context.studioState;
  const { currentScenario } = context.studioState;

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

  const formatCost = () => {
    const usage = response?.usage;
    if (!usage || (!usage.promptTokens && !usage.completionTokens && !usage.totalTokens)) return '-';
    const provider = currentScenario?.configuration?.provider;
    const model = currentScenario?.configuration?.model;
    if (!provider || !model) return '-';
    const inputTokens = usage.promptTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.8) : 0);
    const outputTokens = usage.completionTokens ?? (usage.totalTokens ? Math.round(usage.totalTokens * 0.2) : 0);
    const cost = calculateRequestCost(provider, model, { inputTokens, outputTokens });
    return cost != null ? `$${cost.toFixed(4)}` : '-';
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
              <span className={`text-[11px] font-bold leading-none uppercase ${response?.error ? 'text-red-600' : 'text-green-600'}`}>
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
                    {formatTokens()}
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                    Cost
                  </span>
                  <span className="text-[11px] font-bold text-text-main leading-none">
                    {formatCost()}
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
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white text-sm text-text-main rounded-b-xl">
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
          <div className="max-w-4xl mx-auto space-y-6 markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2" {...props} />,
                code: (codeProps) => {
                  const { node, className, children, inline, ...props } = codeProps as typeof codeProps & { inline?: boolean };
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <pre className="bg-gray-100 p-2 rounded-md mb-2 overflow-x-auto">
                      <code className={`language-${match[1]}`} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-gray-200 px-1 py-0.5 rounded-md" {...props}>
                      {children}
                    </code>
                  );
                },
                a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
              }}
            >
              {response.text}
            </ReactMarkdown>
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
