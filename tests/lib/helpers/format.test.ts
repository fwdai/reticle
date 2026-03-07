import { describe, it, expect } from 'vitest';
import { formatTokens, formatCost } from '@/lib/helpers/format';

// --- formatTokens ---

describe('formatTokens', () => {
  it('returns "-" for null', () => {
    expect(formatTokens(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatTokens(undefined)).toBe('-');
  });

  it('returns "-" for 0', () => {
    expect(formatTokens(0)).toBe('-');
  });

  it('formats sub-1000 tokens with units', () => {
    expect(formatTokens(500)).toBe('500 tokens');
  });

  it('formats sub-1000 tokens without units label when units=false', () => {
    expect(formatTokens(500, false)).toBe('500 ');
  });

  it('formats 1000+ tokens in k with units', () => {
    expect(formatTokens(1500)).toBe('1.5k tokens');
  });

  it('formats 1000+ tokens in k without units label when units=false', () => {
    expect(formatTokens(1500, false)).toBe('1.5k ');
  });

  it('rounds to one decimal place', () => {
    expect(formatTokens(1234)).toBe('1.2k tokens');
  });
});

// --- formatCost ---

describe('formatCost', () => {
  it('returns "-" for null', () => {
    expect(formatCost(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatCost(undefined)).toBe('-');
  });

  it('returns "-" for 0', () => {
    expect(formatCost(0)).toBe('-');
  });

  it('formats cost to 4 decimal places', () => {
    expect(formatCost(0.0012)).toBe('$0.0012');
  });

  it('formats larger costs', () => {
    expect(formatCost(1.5)).toBe('$1.50');
  });
});
