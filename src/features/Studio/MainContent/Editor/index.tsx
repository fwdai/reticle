import { useState, useEffect, useRef } from 'react';
import useResizablePanel from '@/hooks/useResizablePanel';

import StudioMain from './Main';
import Configuration from './Configuration';
import Response from './Response';

export default function Editor() {
  const mainContentRef = useRef<HTMLDivElement>(null);
  const topPanelRef = useRef<HTMLDivElement>(null);

  const [maxResponseHeight, setMaxResponseHeight] = useState(Infinity);
  const [maxConfigWidth, setMaxConfigWidth] = useState(Infinity);

  useEffect(() => {
    const calculateMaxSizes = () => {
      if (mainContentRef.current) {
        const totalAvailableHeight = mainContentRef.current.offsetHeight;
        setMaxResponseHeight(totalAvailableHeight * 0.70);
      }
      if (topPanelRef.current) {
        const totalAvailableWidth = topPanelRef.current.offsetWidth;
        setMaxConfigWidth(totalAvailableWidth * 0.35);
      }
    };

    calculateMaxSizes();
    window.addEventListener('resize', calculateMaxSizes);

    return () => {
      window.removeEventListener('resize', calculateMaxSizes);
    };
  }, []);

  const { size: responsePanelHeight, handleMouseDown: handleResponseMouseDown } = useResizablePanel({
    initialSize: 300,
    minSize: 200,
    maxSize: maxResponseHeight,
    direction: 'vertical',
    containerRef: mainContentRef as React.RefObject<HTMLElement>,
  });

  const { size: configPanelWidth, handleMouseDown: handleConfigMouseDown } = useResizablePanel({
    initialSize: 300,
    minSize: 300,
    maxSize: maxConfigWidth,
    direction: 'horizontal',
    containerRef: topPanelRef as React.RefObject<HTMLElement>,
  });

  return (
    <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
      {/* Top panel containing StudioMain and Configuration */}
      <div ref={topPanelRef} className="flex-1 flex overflow-hidden -mb-[5px]">
        <div className="flex-1 overflow-auto -mr-[5px]">
          <StudioMain />
        </div>

        <div
          className="w-3 h-full resize-handle resize-handle-vertical cursor-ew-resize -mr-[5px]"
          onMouseDown={handleConfigMouseDown}
        />

        <div style={{ width: configPanelWidth }} className="overflow-auto flex-shrink-0">
          <Configuration />
        </div>
      </div>

      <div
        className="h-3 resize-handle resize-handle-horizontal cursor-ns-resize -mb-[5px]"
        onMouseDown={handleResponseMouseDown}
      />

      <div className="overflow-auto flex-shrink-0" style={{ height: responsePanelHeight }}>
        <Response />
      </div>
    </div>
  );
}
