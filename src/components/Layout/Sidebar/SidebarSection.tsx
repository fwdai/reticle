interface SidebarSectionProps {
  title: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

function SidebarSection({ title, headerAction, children }: SidebarSectionProps) {
  return (
    <div>
      <div
        className={`mb-1 pl-4 pr-3 ${headerAction ? "flex items-center justify-between group" : ""}`}
      >
        <h3 className="h-5 flex items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
          {title}
        </h3>
        {headerAction}
      </div>
      <nav className="space-y-1">{children}</nav>
    </div>
  );
}

export default SidebarSection;
