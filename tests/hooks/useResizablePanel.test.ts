// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useResizablePanel from '@/hooks/useResizablePanel';

function mousedown(clientX = 0, clientY = 0) {
  return { clientX, clientY, preventDefault: () => {} } as unknown as React.MouseEvent;
}

function dispatchMouseMove(clientX = 0, clientY = 0) {
  window.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));
}

function dispatchMouseUp() {
  window.dispatchEvent(new MouseEvent('mouseup'));
}

afterEach(() => {
  act(() => dispatchMouseUp()); // ensure listeners are cleaned up between tests
});

describe('useResizablePanel', () => {
  describe('initial state', () => {
    it('uses the provided initialSize', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal', initialSize: 300 })
      );
      expect(result.current.size).toBe(300);
    });

    it('defaults to 200 when no initialSize is provided', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal' })
      );
      expect(result.current.size).toBe(200);
    });

    it('starts with isResizing = false', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal' })
      );
      expect(result.current.isResizing).toBe(false);
    });
  });

  describe('handleMouseDown', () => {
    it('sets isResizing to true', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal' })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));

      expect(result.current.isResizing).toBe(true);
    });
  });

  describe('mousemove — horizontal', () => {
    it('increases size when mouse moves left (delta reversed)', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal', initialSize: 200 })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));
      act(() => dispatchMouseMove(80)); // moved left by 20 → panel grows by 20

      expect(result.current.size).toBe(220);
    });

    it('decreases size when mouse moves right', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal', initialSize: 200 })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));
      act(() => dispatchMouseMove(130)); // moved right by 30 → panel shrinks by 30

      expect(result.current.size).toBe(170);
    });

    it('clamps size to minSize', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal', initialSize: 200, minSize: 100 })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));
      act(() => dispatchMouseMove(400)); // would produce -100, clamped to 100

      expect(result.current.size).toBe(100);
    });

    it('clamps size to maxSize', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal', initialSize: 200, maxSize: 250 })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));
      act(() => dispatchMouseMove(0)); // moved left by 100 → would be 300, clamped to 250

      expect(result.current.size).toBe(250);
    });
  });

  describe('mousemove — vertical', () => {
    it('increases size when mouse moves up (delta reversed)', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'vertical', initialSize: 200 })
      );

      act(() => result.current.handleMouseDown(mousedown(0, 100)));
      act(() => dispatchMouseMove(0, 70)); // moved up by 30 → panel grows by 30

      expect(result.current.size).toBe(230);
    });

    it('decreases size when mouse moves down', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'vertical', initialSize: 200 })
      );

      act(() => result.current.handleMouseDown(mousedown(0, 100)));
      act(() => dispatchMouseMove(0, 140)); // moved down by 40 → panel shrinks by 40

      expect(result.current.size).toBe(160);
    });
  });

  describe('mouseup', () => {
    it('sets isResizing to false', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal' })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));
      expect(result.current.isResizing).toBe(true);

      act(() => dispatchMouseUp());
      expect(result.current.isResizing).toBe(false);
    });

    it('resets document.body cursor and userSelect styles', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal' })
      );

      act(() => result.current.handleMouseDown(mousedown(100)));
      act(() => dispatchMouseMove(80));
      expect(document.body.style.cursor).toBe('ew-resize');

      act(() => dispatchMouseUp());
      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });
  });

  describe('setSize', () => {
    it('sets size directly without a drag interaction', () => {
      const { result } = renderHook(() =>
        useResizablePanel({ direction: 'horizontal', initialSize: 200 })
      );

      act(() => result.current.setSize(400));

      expect(result.current.size).toBe(400);
    });
  });
});
