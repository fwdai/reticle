import { Plus, Folder, Globe, Cloud, History } from "lucide-react";

function Studio() {
  return (
    <>
      <h2 className="text-lg font-bold tracking-tight mb-6 text-sidebar-text">Scenarios</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Collections</h3>
          <nav className="space-y-1">
            <a className="flex items-center justify-between px-3 py-2 rounded-lg nav-item-active" href="#">
              <div className="flex items-center gap-3">
                <Folder className="text-sm text-sidebar-text" size={16} />
                <span className="text-sm text-sidebar-text">My Projects</span>
              </div>
              <span className="text-[10px] text-text-muted bg-white px-1.5 py-0.5 rounded border border-gray-100">12</span>
            </a>
            <a className="flex items-center justify-between px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors" href="#">
              <div className="flex items-center gap-3">
                <Folder className="text-sm" size={16} />
                <span className="text-sm">Shared Items</span>
              </div>
            </a>
          </nav>
        </div>
        <div className="section-divider pt-6 -mt-3">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Environments</h3>
          <nav className="space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors" href="#">
              <Globe className="text-sm" size={16} />
              <span className="text-sm">Production</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors" href="#">
              <Cloud className="text-sm" size={16} />
              <span className="text-sm">Staging</span>
            </a>
          </nav>
        </div>
        <div className="section-divider pt-6 -mt-3 mb-3">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">History</h3>
          <nav className="space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-200 transition-colors" href="#">
              <History className="text-sm" size={16} />
              <span className="text-sm">Recent Runs</span>
            </a>
          </nav>
        </div>
      </div>
      <div className="mt-auto p-6 section-divider pt-6">
        <button className="w-full flex items-center justify-center gap-2 bg-text-main text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-black transition-all shadow-sm">
          <Plus size={16} />
          New Scenario
        </button>
      </div>
    </>
  );
}

export default Studio;
