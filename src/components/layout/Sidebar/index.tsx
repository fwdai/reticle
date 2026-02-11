function Sidebar({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <aside className="w-60 bg-sidebar-light flex flex-col flex-shrink-0 mr-1.5 p-4">
      <h2 className="text-lg font-bold tracking-tight mb-6 text-sidebar-text">{title}</h2>
      <div className="space-y-6">
        {children}
      </div>
    </aside>
  );
}

export default Sidebar;
