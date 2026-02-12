function Sidebar({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <aside className="w-60 bg-sidebar-light flex flex-col flex-shrink-0">
      <h2 className="text-lg font-bold tracking-tight mb-3 text-sidebar-text p-4">{title}</h2>
      <div className="space-y-6">
        {children}
      </div>
    </aside>
  );
}

export default Sidebar;
