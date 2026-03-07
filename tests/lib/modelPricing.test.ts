import { describe, it, expect } from 'vitest';
import { calculateRequestCost } from '@/lib/modelPricing';

// All pricing figures below are derived directly from the PRICING table in modelPricing.ts.
// Prices are cents-per-million-tokens; the function returns dollars (÷100).

// --- unknown provider / model ---

describe('calculateRequestCost — unknown inputs', () => {
  it('returns null for an unknown provider', () => {
    expect(calculateRequestCost('unknown', 'gpt-4o', { inputTokens: 1000 })).toBeNull();
  });

  it('returns null for an unknown model on a known provider', () => {
    expect(calculateRequestCost('openai', 'gpt-99-ultra', { inputTokens: 1000 })).toBeNull();
  });

  it('returns null for an unknown model on anthropic', () => {
    expect(calculateRequestCost('anthropic', 'claude-unknown', {})).toBeNull();
  });
});

// --- basic cost calculation (gpt-4o: input=250, output=1000, cached=125 ¢/M) ---

describe('calculateRequestCost — gpt-4o', () => {
  it('calculates input-only cost correctly', () => {
    // 1_000_000 tokens × 250¢/M = 250¢ = $2.50
    expect(calculateRequestCost('openai', 'gpt-4o', { inputTokens: 1_000_000 })).toBeCloseTo(2.50);
  });

  it('calculates output-only cost correctly', () => {
    // 1_000_000 tokens × 1000¢/M = 1000¢ = $10.00
    expect(calculateRequestCost('openai', 'gpt-4o', { outputTokens: 1_000_000 })).toBeCloseTo(10.00);
  });

  it('calculates cached tokens cost when pricing.cached is set', () => {
    // 1_000_000 cached tokens × 125¢/M = 125¢ = $1.25
    expect(calculateRequestCost('openai', 'gpt-4o', { cachedTokens: 1_000_000 })).toBeCloseTo(1.25);
  });

  it('sums input, output and cached costs', () => {
    // input: (500_000/1M) × 250 = 125¢
    // output: (200_000/1M) × 1000 = 200¢
    // cached: (100_000/1M) × 125 = 12.5¢
    // total: 337.5¢ = $3.375
    expect(
      calculateRequestCost('openai', 'gpt-4o', {
        inputTokens: 500_000,
        outputTokens: 200_000,
        cachedTokens: 100_000,
      })
    ).toBeCloseTo(3.375);
  });

  it('returns 0 for all-zero usage', () => {
    expect(calculateRequestCost('openai', 'gpt-4o', { inputTokens: 0, outputTokens: 0, cachedTokens: 0 })).toBe(0);
  });

  it('returns 0 for empty usage object', () => {
    expect(calculateRequestCost('openai', 'gpt-4o', {})).toBe(0);
  });
});

// --- cached tokens with null pricing (Anthropic) ---

describe('calculateRequestCost — anthropic (no cached pricing)', () => {
  it('does not charge for cached tokens when pricing.cached is null', () => {
    // claude-opus-4-6: cached=null → cached tokens ignored
    // 1M input × 500¢/M = 500¢ = $5.00, cached tokens add nothing
    const withCache = calculateRequestCost('anthropic', 'claude-opus-4-6', {
      inputTokens: 1_000_000,
      cachedTokens: 1_000_000,
    });
    const withoutCache = calculateRequestCost('anthropic', 'claude-opus-4-6', {
      inputTokens: 1_000_000,
    });
    expect(withCache).toBeCloseTo(5.00);
    expect(withCache).toBeCloseTo(withoutCache!);
  });

  it('calculates output cost correctly for anthropic', () => {
    // claude-haiku-4-5: output=500¢/M → 1M tokens = $5.00
    expect(calculateRequestCost('anthropic', 'claude-haiku-4-5', { outputTokens: 1_000_000 })).toBeCloseTo(5.00);
  });
});

// --- Google (all cached: null) ---

describe('calculateRequestCost — google', () => {
  it('calculates input cost for google model', () => {
    // gemini-2.5-pro: input=250¢/M → 1M = $2.50
    expect(calculateRequestCost('google', 'gemini-2.5-pro', { inputTokens: 1_000_000 })).toBeCloseTo(2.50);
  });

  it('ignores cached tokens for google (all cached: null)', () => {
    const withCache = calculateRequestCost('google', 'gemini-2.5-pro', {
      inputTokens: 1_000_000,
      cachedTokens: 1_000_000,
    });
    expect(withCache).toBeCloseTo(2.50);
  });
});

// --- date-suffix stripping (getBaseModelId) ---

describe('calculateRequestCost — model id with date suffix', () => {
  it('strips YYYY-MM-DD suffix and matches base model pricing', () => {
    const withSuffix = calculateRequestCost('openai', 'gpt-4o-2024-11-20', { inputTokens: 1_000_000 });
    const withoutSuffix = calculateRequestCost('openai', 'gpt-4o', { inputTokens: 1_000_000 });
    expect(withSuffix).not.toBeNull();
    expect(withSuffix).toBeCloseTo(withoutSuffix!);
  });

  it('strips -latest suffix and matches base model pricing', () => {
    const withSuffix = calculateRequestCost('openai', 'gpt-4o-latest', { inputTokens: 1_000_000 });
    const withoutSuffix = calculateRequestCost('openai', 'gpt-4o', { inputTokens: 1_000_000 });
    expect(withSuffix).not.toBeNull();
    expect(withSuffix).toBeCloseTo(withoutSuffix!);
  });

  it('strips date suffix for anthropic models', () => {
    const withSuffix = calculateRequestCost('anthropic', 'claude-opus-4-6-2025-01-01', { inputTokens: 1_000_000 });
    const withoutSuffix = calculateRequestCost('anthropic', 'claude-opus-4-6', { inputTokens: 1_000_000 });
    expect(withSuffix).not.toBeNull();
    expect(withSuffix).toBeCloseTo(withoutSuffix!);
  });
});

// --- exact model id takes precedence over stripped base ---

describe('calculateRequestCost — exact id lookup', () => {
  it('uses exact model id when present in the pricing table', () => {
    // gpt-4o-mini is a distinct entry from gpt-4o; verify it uses its own pricing
    // gpt-4o-mini: input=15¢/M; gpt-4o: input=250¢/M
    const miniCost = calculateRequestCost('openai', 'gpt-4o-mini', { inputTokens: 1_000_000 });
    const fullCost = calculateRequestCost('openai', 'gpt-4o', { inputTokens: 1_000_000 });
    expect(miniCost).not.toBeNull();
    expect(fullCost).not.toBeNull();
    expect(miniCost!).toBeLessThan(fullCost!);
    expect(miniCost).toBeCloseTo(0.15); // 15¢/M = $0.15/M
  });
});
