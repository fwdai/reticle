import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { useState, useEffect, useRef } from 'react';

import StudioMain from "./Main";
import Configuration from "./Configuration";
import Response from "./Response";


function Studio() {
  const [responsePanelHeight, setResponsePanelHeight] = useState(250); // Default height
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialPanelHeight, setInitialPanelHeight] = useState(250);

  const mainContentRef = useRef<HTMLDivElement>(null); // Ref for the main content area


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setInitialMouseY(e.clientY);
    setInitialPanelHeight(responsePanelHeight);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - initialMouseY;

      // Calculate max height based on the available space
      let maxResponseHeight = 0;
      if (mainContentRef.current) {
        // Approximate height of the header (adjust if needed)
        const headerHeight = 60; // Assuming header has a fixed height
        const totalAvailableHeight = mainContentRef.current.offsetHeight - headerHeight - 12; // 12 for the handle height
        maxResponseHeight = totalAvailableHeight * 0.7; // Max 70% of available height for response
      }

      const newHeight = Math.max(
        150, // Minimum height
        Math.min(
          initialPanelHeight - deltaY,
          maxResponseHeight > 0 ? maxResponseHeight : Infinity // Apply max height if calculated
        )
      );
      setResponsePanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize'; // Change cursor globally during resize
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = ''; // Reset cursor
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizing, initialMouseY, initialPanelHeight]);


  return (
    <MainContent>
      <Header />
      <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden -mb-1">
          <StudioMain />
          <Configuration />
        </div>
        <div
          className="h-3 resize-handle cursor-ns-resize"
          onMouseDown={handleMouseDown}
        ></div>
        <div className="overflow-auto" style={{ height: responsePanelHeight }}>
          <Response />
        </div>
      </div>
    </MainContent>
  );
}

export default Studio;
