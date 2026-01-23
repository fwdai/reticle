function Environments() {
  return (
    <>
      <h2 className="text-lg font-bold tracking-tight mb-6 text-sidebar-text">Environments</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Environments</h3>
          <nav className="space-y-1">
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">Production</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">Staging</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-text hover:bg-gray-100 transition-colors" href="#">
              <span className="text-sm">Development</span>
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Environments;
