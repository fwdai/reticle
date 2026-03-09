import type { LucideIcon } from "lucide-react";

interface FilterEmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function FilterEmptyState({ icon: Icon, title, subtitle }: FilterEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center -translate-y-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
        <Icon className="h-6 w-6 text-text-muted/60" />
      </div>
      <p className="text-sm font-medium text-text-main">{title}</p>
      <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}
