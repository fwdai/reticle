interface TabTitleProps {
  label: string;
  count?: number;
}

export function TabTitle({ label, count }: TabTitleProps) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      {count !== undefined && (
        <span className="rounded-md bg-primary/15 px-1 py-0.5 text-[10px] font-bold text-primary">
          {count}
        </span>
      )}
    </span>
  );
}
