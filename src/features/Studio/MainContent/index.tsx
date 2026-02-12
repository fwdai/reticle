import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { useState, useEffect } from 'react';

import StudioMain from "./Main";
import Configuration from "./Configuration";
import Response from "./Response";


function Studio() {
  const [responsePanelHeight, setResponsePanelHeight] = useState(250); // Default height
  const [isResizing, setIsResizing] = useState(false);
  const [initialMouseY, setInitialMouseY] = useState(0);
  const [initialPanelHeight, setInitialPanelHeight] = useState(250);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setInitialMouseY(e.clientY);
    setInitialPanelHeight(responsePanelHeight);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - initialMouseY;
      const newHeight = Math.max(100, initialPanelHeight - deltaY); // Minimum height of 100px
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
      <div className="flex-1 flex flex-col overflow-hidden">
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
