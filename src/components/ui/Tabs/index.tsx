import React, { useState, Children, isValidElement } from "react";
import TabPanel from "./TabPanel";

interface TabPanelProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

interface TabsProps {
  children: React.ReactNode;
}

function Tabs({ children }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveIndex(index);
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
      <div className="flex border-b border-border-light px-5 gap-4 bg-slate-50 h-[45px] items-center">
        {tabs}
      </div>
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#FCFDFF]">
        {activeContent}
      </div>
    </div>
  );
}

export { Tabs };

