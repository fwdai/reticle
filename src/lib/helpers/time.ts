export function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function formatDuration(ms?: number | null): string {
  if (ms == null || ms === 0) return "-";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1).replace(/\.0$/, "")}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

export function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return "Just now";
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  if (hr < 24) return `${hr} hr${hr === 1 ? "" : "s"} ago`;
  if (day < 7) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString();
}