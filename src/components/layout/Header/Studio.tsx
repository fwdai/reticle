import { Play, Save, Share } from "lucide-react";

function StudioHeader() {
  return (
    <>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-text-muted">Collections</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-text-main">GPT-4o Debugger</span>
        <span className="bg-green-50 text-[10px] text-green-600 font-bold px-2 py-0.5 rounded-full border border-green-100 ml-2 uppercase tracking-tight">Active</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white shadow-sm text-text-main">Editor</button>
          <button className="px-4 py-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors">Visualizer</button>
        </div>
        <div className="h-6 w-px bg-border-light"></div>
        <div className="flex items-center gap-2">
          <button className="bg-primary hover:bg-[#048fa9] text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
            <Play size={18} className="font-bold" />
            Run
          </button>
          <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Save size={18} />
          </button>
          <button className="p-2 text-text-muted hover:text-text-main hover:bg-gray-100 rounded-lg transition-colors border border-border-light bg-white">
            <Share size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

export default StudioHeader;
