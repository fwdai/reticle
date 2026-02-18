interface SidebarProps {
  title: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

function Sidebar({ title, headerAction, children }: SidebarProps) {
  return (
    <aside className="w-60 bg-sidebar-light flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between gap-2 p-4">
        <h2 className="text-lg font-bold tracking-tight text-sidebar-text">{title}</h2>
        {headerAction}
      </div>
      <div className="space-y-6 flex-1 overflow-y-auto">
        {children}
      </div>
    </aside>
  );
}

export default Sidebar;
export { default as SidebarSection } from "./SidebarSection";
export { default as SidebarItem } from "./SidebarItem";