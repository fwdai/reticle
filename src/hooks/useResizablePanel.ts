import { useState, useEffect, useCallback, useRef } from 'react';

type Direction = 'horizontal' | 'vertical';

interface UseResizablePanelProps {
  initialSize?: number; // Initial width or height
  minSize?: number;     // Minimum width or height in pixels
  maxSize?: number;     // Maximum width or height in pixels
  direction: Direction; // 'horizontal' for width, 'vertical' for height
  containerRef?: React.RefObject<HTMLElement>; // Optional: Reference to the parent container for max size calculation
}

const useResizablePanel = ({
  initialSize = 200,
  minSize = 50,
  maxSize = Infinity, // Use Infinity if no specific max size
  direction,
  containerRef,
}: UseResizablePanelProps) => {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const initialMousePosition = useRef(0);
  const initialPanelSize = useRef(initialSize);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    initialMousePosition.current = direction === 'vertical' ? e.clientY : e.clientX;
    initialPanelSize.current = size;
    e.preventDefault(); // Prevent text selection during drag
  }, [direction, size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const currentMousePosition = direction === 'vertical' ? e.clientY : e.clientX;
      let delta = currentMousePosition - initialMousePosition.current;

      // Adjust delta based on direction for resizing behavior
      // For vertical: dragging down (positive delta) makes panel smaller if handle is above, larger if handle is below
      // For horizontal: dragging right (positive delta) makes panel larger
      if (direction === 'vertical') {
        delta = -delta; // Reverse delta for vertical: dragging handle down makes panel larger
      } else if (direction === 'horizontal') {
        delta = -delta; // Reverse delta for horizontal: dragging handle left makes panel larger
      }

      let newSize = initialPanelSize.current + delta;

      // Apply limits
      newSize = Math.max(minSize, newSize);
      newSize = Math.min(newSize, maxSize);


      setSize(newSize);

      // Change cursor globally during resize
      document.body.style.cursor = direction === 'vertical' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = ''; // Reset cursor
      document.body.style.userSelect = ''; // Reset user-select
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = ''; // Ensure cursor is reset on unmount or if isResizing becomes false
      document.body.style.userSelect = '';
    };
  }, [isResizing, minSize, maxSize, direction, containerRef]);

  return { size, setSize, isResizing, handleMouseDown };
};

export default useResizablePanel;
