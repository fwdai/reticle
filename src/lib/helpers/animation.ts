/** Easing function: slow at end. Maps t ∈ [0, 1] to eased progress. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
