import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { wait, formatDuration, formatRelativeTime } from '@/lib/helpers/time';

// --- wait ---

describe('wait', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves after the specified milliseconds', async () => {
    const promise = wait(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('does not resolve before the time elapses', () => {
    let resolved = false;
    wait(500).then(() => { resolved = true; });
    vi.advanceTimersByTime(499);
    expect(resolved).toBe(false);
  });
});

// --- formatDuration ---

describe('formatDuration', () => {
  it('returns "-" for null', () => {
    expect(formatDuration(null)).toBe('-');
  });

  it('returns "-" for undefined', () => {
    expect(formatDuration(undefined)).toBe('-');
  });

  it('returns "-" for 0', () => {
    expect(formatDuration(0)).toBe('-');
  });

  it('formats sub-second durations in ms', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('rounds ms to nearest integer', () => {
    expect(formatDuration(500.6)).toBe('501ms');
  });

  it('formats durations under 1 minute in seconds', () => {
    expect(formatDuration(1000)).toBe('1s');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(59_999)).toBe('60s');
  });

  it('strips trailing .0 from seconds', () => {
    expect(formatDuration(2000)).toBe('2s');
    expect(formatDuration(10_000)).toBe('10s');
  });

  it('formats durations of 1 minute with seconds', () => {
    expect(formatDuration(60_000)).toBe('1m');
    expect(formatDuration(90_000)).toBe('1m 30s');
  });

  it('omits seconds when they are 0', () => {
    expect(formatDuration(120_000)).toBe('2m');
  });

  it('formats multi-minute durations', () => {
    expect(formatDuration(125_000)).toBe('2m 5s');
  });
});

// --- formatRelativeTime ---

describe('formatRelativeTime', () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => vi.setSystemTime(NOW));
  afterEach(() => vi.useRealTimers());

  it('returns "Just now" for timestamps less than 60s ago', () => {
    expect(formatRelativeTime(NOW - 30_000)).toBe('Just now');
    expect(formatRelativeTime(NOW - 59_000)).toBe('Just now');
  });

  it('returns "X mins ago" for timestamps under an hour', () => {
    expect(formatRelativeTime(NOW - 2 * 60_000)).toBe('2 mins ago');
    expect(formatRelativeTime(NOW - 59 * 60_000)).toBe('59 mins ago');
  });

  it('uses singular "min" for exactly 1 minute', () => {
    expect(formatRelativeTime(NOW - 60_000)).toBe('1 min ago');
  });

  it('returns "X hrs ago" for timestamps under a day', () => {
    expect(formatRelativeTime(NOW - 2 * 3_600_000)).toBe('2 hrs ago');
    expect(formatRelativeTime(NOW - 23 * 3_600_000)).toBe('23 hrs ago');
  });

  it('uses singular "hr" for exactly 1 hour', () => {
    expect(formatRelativeTime(NOW - 3_600_000)).toBe('1 hr ago');
  });

  it('returns "X days ago" for timestamps under 7 days', () => {
    expect(formatRelativeTime(NOW - 2 * 86_400_000)).toBe('2 days ago');
    expect(formatRelativeTime(NOW - 6 * 86_400_000)).toBe('6 days ago');
  });

  it('uses singular "day" for exactly 1 day', () => {
    expect(formatRelativeTime(NOW - 86_400_000)).toBe('1 day ago');
  });

  it('returns a locale date string for timestamps 7+ days ago', () => {
    const ts = NOW - 8 * 86_400_000;
    expect(formatRelativeTime(ts)).toBe(new Date(ts).toLocaleDateString());
  });
});
