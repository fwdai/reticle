import React, { useState, Children, isValidElement } from "react";
import TabPanel from "./TabPanel";

interface TabPanelProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

interface TabsProps {
  children: React.ReactNode;
  /** Controlled: when provided, tab selection is controlled externally */
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

function Tabs({ children, activeIndex: controlledIndex, onActiveIndexChange }: TabsProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = controlledIndex !== undefined;
  const activeIndex = isControlled ? controlledIndex : internalIndex;

  const handleTabClick = (index: number) => {
    if (isControlled) {
      onActiveIndexChange?.(index);
    } else {
      setInternalIndex(index);
    }
  };

  const tabs = Children.map(children, (child, index) => {
    if (isValidElement<TabPanelProps>(child) && child.type === TabPanel) {
      return (
        <button
          key={index}
          onClick={() => handleTabClick(index)}
          className={`relative h-full px-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center
            ${activeIndex === index
              ? "text-primary tab-active-underline" // New class for active tab underline
              : "text-text-muted hover:text-text-main transition-colors"
            }`}
        >
          {child.props.title}
        </button>
      );
    }
    return null;
  });

  const activeContent = Children.toArray(children)[activeIndex];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <div className="flex border-b border-border-light px-5 gap-4 bg-slate-50 h-[45px] items-center flex-shrink-0">
        {tabs}
      </div>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#FCFDFF]">
        {activeContent}
      </div>
    </div>
  );
}

export { Tabs };

