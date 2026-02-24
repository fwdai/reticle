export function formatTokens(tokens?: number | null, units: boolean = true): string {
  if (tokens == null || tokens === 0) return "-";
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k ${units ? "tokens" : ""}`;
  return `${tokens} ${units ? "tokens" : ""}`;
}

export function formatCost(cost?: number | null): string {
  if (cost == null || cost === 0) return "-";
  return `$${cost.toFixed(4)}`;
}
