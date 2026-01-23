import { Copy, Code } from "lucide-react";

function Response() {
  return (
    <section className="h-1/3 border-t border-border-light flex flex-col bg-white rounded-b-xl">
      <div className="h-11 border-b border-border-light flex items-center justify-between px-8 bg-sidebar-light/40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-green-500 rounded-full"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">
              Response Console
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Status
              </span>
              <span className="text-[11px] font-mono font-bold text-green-600 leading-none uppercase">
                200 OK
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Latency
              </span>
              <span className="text-[11px] font-mono font-bold text-text-main leading-none">
                1.24s
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Usage
              </span>
              <span className="text-[11px] font-mono font-bold text-text-main leading-none">
                452 tokens
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
                Cost
              </span>
              <span className="text-[11px] font-mono font-bold text-text-main leading-none">
                $0.0031
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1">
            <Code size={14} />
            RAW JSON
          </button>
          <button className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1">
            <Copy size={14} />
            COPY
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white font-mono text-sm leading-relaxed text-text-main rounded-b-xl">
        <div className="max-w-4xl mx-auto space-y-6">
          <p>
            To build a clean UI with Tailwind CSS, you should follow the
            utility-first principle while maintaining a structured layout. Here
            is a simple card component example:
          </p>
          <div className="bg-[#1A1A1A] text-[#E0E0E0] p-6 rounded-2xl border border-black shadow-lg relative group">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-white/40 hover:text-white">
                <Copy size={16} />
              </button>
            </div>
            <pre className="overflow-x-auto text-xs sm:text-sm">
              <code>{`<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white">
  <div class="px-6 py-4">
    <div class="font-bold text-xl mb-2">Modern Card</div>
    <p class="text-gray-700 text-base">
      This is a clean implementation using Tailwind.
    </p>
  </div>
</div>`}</code>
            </pre>
          </div>
          <p>
            This approach ensures your design is consistent and easy to maintain
            across large projects. Let me know if you need more complex layouts
            or specialized React hooks!
          </p>
          <div className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1 align-middle"></div>
        </div>
      </div>
    </section>
  );
}

export default Response;
