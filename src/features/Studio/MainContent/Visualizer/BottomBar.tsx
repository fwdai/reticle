export function BottomBar() {
  return (
    <div className="flex items-center justify-between border-t border-border bg-panel px-6 py-2.5">
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>Pipeline: <span className="font-semibold text-foreground">5 nodes</span></span>
        <span className="text-border">·</span>
        <span>Active: <span className="font-semibold text-primary">3</span></span>
        <span className="text-border">·</span>
        <span>Idle: <span className="font-semibold text-muted-foreground">2</span></span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <button className="hover:text-foreground transition-colors">Zoom to fit</button>
        <span className="text-border">·</span>
        <span>100%</span>
      </div>
    </div>
  );
}
