import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon?: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  indent?: boolean;
  /** Trailing content (e.g. dropdown menu) - use stopPropagation on interactive elements to prevent row click */
  actions?: React.ReactNode;
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  count,
  indent = false,
  actions,
}: SidebarItemProps) {
  const baseClass =
    "flex items-center gap-3 px-4 py-1.5 text-sm text-sidebar-text transition-colors w-full text-left";
  const interactiveClass = onClick ? "hover:bg-gray-200 cursor-pointer" : "";
  const activeClass = active ? "bg-gray-200" : "";
  const indentClass = indent ? "pl-6" : "";
  const hasTrailing = actions != null || count != null;

  const content = (
    <>
      {Icon && (
        <Icon className="h-4 w-4 flex-shrink-0 text-sidebar-text" strokeWidth={1.5} />
      )}
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {count != null && (
        <span className="text-[11px] text-text-muted tabular-nums flex-shrink-0">{count}</span>
      )}
      {actions}
    </>
  );

  const wrapperClass = `${baseClass} ${activeClass} ${indentClass} ${hasTrailing ? "justify-between" : ""} ${actions ? "group" : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${wrapperClass} ${interactiveClass}`}
      >
        {content}
      </button>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

export default SidebarItem;
