interface ConfigChipProps {
  label: string;
  value: string;
}

export function ConfigChip({ label, value }: ConfigChipProps) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted/50 px-2 py-1.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
