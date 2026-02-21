export function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function formatDuration(seconds?: number) {
  if (seconds == null || seconds === 0) return "-";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function formatTokens(tokens?: number) {
  if (tokens == null || tokens === 0) return "-";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k tokens`;
  return `${tokens} tokens`;
}

export function formatCost(cost?: number) {
  if (cost == null || cost === 0) return "-";
  return `$${cost.toFixed(4)}`;
}
