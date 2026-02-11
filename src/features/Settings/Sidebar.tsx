import Sidebar from "@/components/Layout/Sidebar";

function Settings() {
  return (
    <Sidebar title="Settings">
      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">General</h3>
          <nav className="space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">Preferences</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">Account</span>
            </a>
          </nav>
        </div>
        <div className="section-divider pt-6 -mt-6">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Advanced</h3>
          <nav className="space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">API Keys</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">Integrations</span>
            </a>
          </nav>
        </div>
      </div>
    </Sidebar>
  );
}

export default Settings;
