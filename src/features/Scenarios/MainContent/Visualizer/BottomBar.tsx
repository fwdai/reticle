interface BottomBarProps {
  total: number;
  active: number;
  idle: number;
  error: number;
}

export function BottomBar({ total, active, idle, error }: BottomBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-2.5">
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>Pipeline: <span className="font-semibold text-foreground">{total} nodes</span></span>
        <span className="text-border">·</span>
        <span>Active: <span className="font-semibold text-primary">{active}</span></span>
        <span className="text-border">·</span>
        <span>Idle: <span className="font-semibold text-muted-foreground">{idle}</span></span>
        {error > 0 && (
          <>
            <span className="text-border">·</span>
            <span>Error: <span className="font-semibold text-destructive">{error}</span></span>
          </>
        )}
      </div>
    </div>
  );
}
