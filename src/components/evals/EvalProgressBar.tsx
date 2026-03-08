interface EvalProgressBarProps {
  progress: number;
}

export function EvalProgressBar({ progress }: EvalProgressBarProps) {
  return (
    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
