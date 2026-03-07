// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '@/hooks/usePersistedState';

beforeEach(() => localStorage.clear());

describe('usePersistedState', () => {
  it('returns the default value when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedState('key', 42));
    expect(result.current[0]).toBe(42);
  });

  it('reads an existing value from localStorage on mount', () => {
    localStorage.setItem('key', JSON.stringify('hello'));
    const { result } = renderHook(() => usePersistedState('key', 'default'));
    expect(result.current[0]).toBe('hello');
  });

  it('updates state and persists to localStorage when the setter is called', () => {
    const { result } = renderHook(() => usePersistedState('key', 0));

    act(() => result.current[1](99));

    expect(result.current[0]).toBe(99);
    expect(JSON.parse(localStorage.getItem('key')!)).toBe(99);
  });

  it('works with object values', () => {
    const { result } = renderHook(() => usePersistedState<{ x: number }>('key', { x: 0 }));

    act(() => result.current[1]({ x: 7 }));

    expect(result.current[0]).toEqual({ x: 7 });
    expect(JSON.parse(localStorage.getItem('key')!)).toEqual({ x: 7 });
  });

  it('falls back to the default value when stored JSON is invalid', () => {
    localStorage.setItem('key', 'not-valid-json{{{');
    const { result } = renderHook(() => usePersistedState('key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('isolates state between different keys', () => {
    const { result: a } = renderHook(() => usePersistedState('a', 1));
    const { result: b } = renderHook(() => usePersistedState('b', 2));

    act(() => a.current[1](10));

    expect(a.current[0]).toBe(10);
    expect(b.current[0]).toBe(2);
  });
});
