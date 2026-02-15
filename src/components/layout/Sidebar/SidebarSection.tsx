function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 pl-4 pr-3">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <nav className="space-y-1">{children}</nav>
    </div>
  );
}

export default SidebarSection;
