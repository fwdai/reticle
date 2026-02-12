import { useState, useEffect, useRef } from 'react';
import MainContent from "@/components/Layout/MainContent";
import useResizablePanel from "@/hooks/useResizablePanel";

import Header from "../Header";
import StudioMain from "./Main";
import Configuration from "./Configuration";
import Response from "./Response";


function Studio() {
  const mainContentRef = useRef<HTMLDivElement>(null); // Ref for the main content area encompassing StudioMain, Config, and Response
  const topPanelRef = useRef<HTMLDivElement>(null); // Ref for the top panel containing StudioMain and Configuration

  const [maxResponseHeight, setMaxResponseHeight] = useState(Infinity);
  const [maxConfigWidth, setMaxConfigWidth] = useState(Infinity);

  useEffect(() => {
    const calculateMaxSizes = () => {
      if (mainContentRef.current) {
        // total height of the area containing StudioMain/Config, handle, and Response
        const totalAvailableHeight = mainContentRef.current.offsetHeight;
        // Limit Response panel to max 70% of this total available height
        setMaxResponseHeight(totalAvailableHeight * 0.70);
      }
      if (topPanelRef.current) {
        // total width of the area containing StudioMain and Configuration
        const totalAvailableWidth = topPanelRef.current.offsetWidth;
        // Limit Configuration panel to max 30% of this total available width
        setMaxConfigWidth(totalAvailableWidth * 0.35);
      }
    };

    calculateMaxSizes(); // Calculate initially
    window.addEventListener('resize', calculateMaxSizes); // Recalculate on window resize

    return () => {
      window.removeEventListener('resize', calculateMaxSizes);
    };
  }, []);


  // Resizing for the Response panel (vertical)
  const { size: responsePanelHeight, handleMouseDown: handleResponseMouseDown } = useResizablePanel({
    initialSize: 300,
    minSize: 200,
    maxSize: maxResponseHeight, // Use dynamically calculated max height
    direction: 'vertical',
    containerRef: mainContentRef as React.RefObject<HTMLElement>,
  });

  // Resizing for the Configuration panel (horizontal)
  const { size: configPanelWidth, handleMouseDown: handleConfigMouseDown } = useResizablePanel({
    initialSize: 300, // Default width for Configuration
    minSize: 300,
    maxSize: maxConfigWidth, // Use dynamically calculated max width
    direction: 'horizontal',
    containerRef: topPanelRef as React.RefObject<HTMLElement>,
  });


  return (
    <MainContent>
      <Header />
      <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Top panel containing StudioMain and Configuration */}
        <div ref={topPanelRef} className="flex-1 flex overflow-hidden -mb-[5px]">
          {/* StudioMain takes remaining space */}
          <div className="flex-1 overflow-auto -mr-[5px]">
            <StudioMain />
          </div>

          {/* Horizontal Resize Handle for Configuration */}
          <div
            className="w-3 h-full resize-handle resize-handle-vertical cursor-ew-resize -mr-[5px]" // Added resize-handle-vertical
            onMouseDown={handleConfigMouseDown}
          ></div>

          {/* Configuration panel */}
          <div style={{ width: configPanelWidth }} className="overflow-auto flex-shrink-0">
            <Configuration />
          </div>
        </div>

        {/* Vertical Resize Handle for Response */}
        <div
          className="h-3 resize-handle resize-handle-horizontal cursor-ns-resize -mb-[5px]" // Added resize-handle-horizontal
          onMouseDown={handleResponseMouseDown}
        ></div>

        {/* Response panel */}
        <div className="overflow-auto flex-shrink-0" style={{ height: responsePanelHeight }}>
          <Response />
        </div>
      </div>
    </MainContent>
  );
}

export default Studio;
