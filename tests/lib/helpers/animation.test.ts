import { describe, it, expect } from 'vitest';
import { easeOutCubic } from '@/lib/helpers/animation';

describe('easeOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it('returns 0.5 at t=~0.206 (midpoint of eased range)', () => {
    // 1 - (1 - t)^3 = 0.5 → t = 1 - 0.5^(1/3) ≈ 0.2063
    expect(easeOutCubic(1 - Math.cbrt(0.5))).toBeCloseTo(0.5);
  });

  it('returns value greater than t for t in (0, 1) — ease-out accelerates early', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('is monotonically increasing', () => {
    const values = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(easeOutCubic);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
