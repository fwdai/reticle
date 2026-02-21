export function formatTokens(tokens?: number | null): string {
  if (tokens == null || tokens === 0) return "-";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k tokens`;
  return `${tokens} tokens`;
}

export function formatCost(cost?: number | null): string {
  if (cost == null || cost === 0) return "-";
  return `$${cost.toFixed(4)}`;
}
