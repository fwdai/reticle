import { Clock, Zap } from "lucide-react";
import { panelBase, panelHeader, panelTitle } from "../constants";

function formatRelativeTime(epoch: number | null): string {
  if (!epoch) return "—";
  const seconds = Math.floor(Date.now() / 1000 - epoch);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface UsageProps {
  usedBy: number;
  updatedAt: number | null;
}

export function Usage({ usedBy, updatedAt }: UsageProps) {
  return (
    <div className={panelBase}>
      <div className={panelHeader}>
        <span className={panelTitle}>Usage</span>
      </div>
      <div className="flex items-center gap-6 p-5">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-text-main">{usedBy}</span>
          <span className="text-xs text-text-muted">
            {usedBy === 1
              ? "scenario or agent using this tool"
              : "scenarios and agents using this tool"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs text-text-muted">
            Updated {formatRelativeTime(updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
