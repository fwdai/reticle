// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/storage', () => ({
  listPromptTemplates: vi.fn(),
}));

import { listPromptTemplates } from '@/lib/storage';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';
import type { PromptTemplate } from '@/types/index';

const mockList = vi.mocked(listPromptTemplates);

function makeTemplate(name: string): PromptTemplate {
  return { name, content: `content-${name}`, variables_json: null } as PromptTemplate;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('usePromptTemplates', () => {
  describe('initial fetch', () => {
    it('starts with an empty templates array', () => {
      mockList.mockResolvedValue([]);
      const { result } = renderHook(() => usePromptTemplates());
      expect(result.current.templates).toEqual([]);
    });

    it('populates templates after mount', async () => {
      const templates = [makeTemplate('a'), makeTemplate('b')];
      mockList.mockResolvedValue(templates);

      const { result } = renderHook(() => usePromptTemplates());

      await waitFor(() => expect(result.current.templates).toEqual(templates));
    });

    it('leaves templates empty when storage rejects', async () => {
      mockList.mockRejectedValue(new Error('db error'));

      const { result } = renderHook(() => usePromptTemplates());

      await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
      expect(result.current.templates).toEqual([]);
    });
  });

  describe('fetchTemplates', () => {
    it('re-fetches and replaces the template list', async () => {
      mockList.mockResolvedValueOnce([makeTemplate('a')]);
      const { result } = renderHook(() => usePromptTemplates());
      await waitFor(() => expect(result.current.templates).toHaveLength(1));

      mockList.mockResolvedValueOnce([makeTemplate('b'), makeTemplate('c')]);
      await act(() => result.current.fetchTemplates());

      expect(result.current.templates).toEqual([makeTemplate('b'), makeTemplate('c')]);
    });
  });

  describe('upsertTemplate', () => {
    it('appends a new template', async () => {
      mockList.mockResolvedValue([makeTemplate('a')]);
      const { result } = renderHook(() => usePromptTemplates());
      await waitFor(() => expect(result.current.templates).toHaveLength(1));

      act(() => result.current.upsertTemplate(makeTemplate('b')));

      expect(result.current.templates).toHaveLength(2);
      expect(result.current.templates[1].name).toBe('b');
    });

    it('replaces an existing template with the same name', async () => {
      mockList.mockResolvedValue([makeTemplate('a')]);
      const { result } = renderHook(() => usePromptTemplates());
      await waitFor(() => expect(result.current.templates).toHaveLength(1));

      const updated = { ...makeTemplate('a'), content: 'updated' };
      act(() => result.current.upsertTemplate(updated));

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].content).toBe('updated');
    });
  });

  describe('parseVariables', () => {
    it('returns an empty array for null', () => {
      mockList.mockResolvedValue([]);
      const { result } = renderHook(() => usePromptTemplates());
      expect(result.current.parseVariables(null)).toEqual([]);
    });

    it('returns an empty array for undefined', () => {
      mockList.mockResolvedValue([]);
      const { result } = renderHook(() => usePromptTemplates());
      expect(result.current.parseVariables(undefined)).toEqual([]);
    });

    it('parses a valid JSON array of variables', () => {
      mockList.mockResolvedValue([]);
      const { result } = renderHook(() => usePromptTemplates());
      const vars = [{ name: 'x', value: '1' }];
      expect(result.current.parseVariables(JSON.stringify(vars))).toEqual(vars);
    });

    it('returns an empty array for invalid JSON', () => {
      mockList.mockResolvedValue([]);
      const { result } = renderHook(() => usePromptTemplates());
      expect(result.current.parseVariables('not-json')).toEqual([]);
    });
  });
});
