import { ChevronDown, Copy, Code, Info } from "lucide-react";

function Studio() {
  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 border-r border-border-light">
          <div className="flex border-b border-border-light px-8 gap-10 bg-white">
            <button className="relative py-4 text-xs font-bold tracking-widest text-primary border-b-2 border-primary uppercase">System Message</button>
            <button className="relative py-4 text-xs font-bold tracking-widest text-text-muted hover:text-text-main border-b-2 border-transparent transition-colors uppercase">Prompt</button>
            <button className="relative py-4 text-xs font-bold tracking-widest text-text-muted hover:text-text-main border-b-2 border-transparent transition-colors uppercase">Model Settings</button>
            <button className="relative py-4 text-xs font-bold tracking-widest text-text-muted hover:text-text-main border-b-2 border-transparent transition-colors uppercase">Tools</button>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#FCFDFF]">
            <div className="max-w-4xl h-full flex flex-col">
              <div className="flex-1 bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">System Instructions</span>
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 bg-primary rounded-full"></span>
                    <span className="text-[10px] text-text-muted font-medium">Auto-saving</span>
                  </div>
                </div>
                <textarea
                  className="flex-1 p-6 bg-transparent border-none focus:ring-0 text-sm font-mono leading-relaxed resize-none text-text-main placeholder:text-gray-300"
                  placeholder="Type your system instructions here..."
                  defaultValue="You are a helpful technical assistant specialized in React and Tailwind CSS. Always provide code examples that are modern, clean, and use best practices for responsive design. Focus on performance and accessibility."
                />
                <div className="px-5 py-2 border-t border-border-light bg-sidebar-light/30 flex justify-end">
                  <span className="text-[10px] text-text-muted font-medium uppercase tracking-tighter">142 CHARACTERS • UTF-8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="w-80 flex-shrink-0 bg-sidebar-light overflow-y-auto custom-scrollbar">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Configuration</h3>
              <Info className="text-text-muted cursor-pointer hover:text-text-main" size={16} />
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-main">LLM Provider</label>
                <select className="w-full text-sm rounded-xl border-border-light bg-white py-2.5 px-3 shadow-sm focus:ring-primary focus:border-primary transition-all cursor-pointer">
                  <option>OpenAI</option>
                  <option>Anthropic</option>
                  <option>Google Gemini</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-main">Model Variant</label>
                <select className="w-full text-sm rounded-xl border-border-light bg-white py-2.5 px-3 shadow-sm focus:ring-primary focus:border-primary transition-all cursor-pointer">
                  <option>gpt-4o-2024-05-13</option>
                  <option>gpt-4-turbo</option>
                  <option>gpt-3.5-turbo</option>
                </select>
              </div>
              <div className="space-y-6 pt-6 border-t border-border-light">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-text-main">Temperature</label>
                    <input className="w-10 text-right bg-transparent border-none text-xs font-mono text-primary font-bold focus:ring-0 p-0" type="text" defaultValue="0.7" />
                  </div>
                  <input className="w-full" max={1} min={0} step={0.1} type="range" defaultValue={0.7} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-text-main">Top P</label>
                    <input className="w-10 text-right bg-transparent border-none text-xs font-mono text-primary font-bold focus:ring-0 p-0" type="text" defaultValue="1.0" />
                  </div>
                  <input className="w-full" max={1} min={0} step={0.05} type="range" defaultValue={1.0} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-text-main">Max Tokens</label>
                    <input className="w-14 text-right bg-transparent border-none text-xs font-mono text-primary font-bold focus:ring-0 p-0" type="text" defaultValue="2048" />
                  </div>
                  <input className="w-full" max={4096} min={1} step={1} type="range" defaultValue={2048} />
                </div>
              </div>
              <div className="pt-6">
                <button className="w-full flex items-center justify-between text-xs font-bold text-text-muted hover:text-text-main transition-colors">
                  ADVANCED OPTIONS
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <section className="h-1/3 border-t border-border-light flex flex-col bg-white rounded-b-xl">
        <div className="h-11 border-b border-border-light flex items-center justify-between px-8 bg-sidebar-light/40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="size-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-main">Response Console</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">Status</span>
                <span className="text-[11px] font-mono font-bold text-green-600 leading-none uppercase">200 OK</span>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">Latency</span>
                <span className="text-[11px] font-mono font-bold text-text-main leading-none">1.24s</span>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">Usage</span>
                <span className="text-[11px] font-mono font-bold text-text-main leading-none">452 tokens</span>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">Cost</span>
                <span className="text-[11px] font-mono font-bold text-text-main leading-none">$0.0031</span>
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
            <p>To build a clean UI with Tailwind CSS, you should follow the utility-first principle while maintaining a structured layout. Here is a simple card component example:</p>
            <div className="bg-[#1A1A1A] text-[#E0E0E0] p-6 rounded-2xl border border-black shadow-lg relative group">
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-white/40 hover:text-white"><Copy size={16} /></button>
              </div>
              <pre className="overflow-x-auto text-xs sm:text-sm"><code>{`<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white">
  <div class="px-6 py-4">
    <div class="font-bold text-xl mb-2">Modern Card</div>
    <p class="text-gray-700 text-base">
      This is a clean implementation using Tailwind.
    </p>
  </div>
</div>`}</code></pre>
            </div>
            <p>This approach ensures your design is consistent and easy to maintain across large projects. Let me know if you need more complex layouts or specialized React hooks!</p>
            <div className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1 align-middle"></div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Studio;
