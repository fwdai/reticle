import React, { useState, Children, isValidElement } from "react";
import TabPanel from "./TabPanel";

interface TabPanelProps {
  title: string;
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
          className={`relative py-4 text-xs font-bold tracking-widest uppercase ${
            activeIndex === index
              ? "text-primary border-b-2 border-primary"
              : "text-text-muted hover:text-text-main border-b-2 border-transparent transition-colors"
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
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex border-b border-border-light px-8 gap-10 bg-white">
        {tabs}
      </div>
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#FCFDFF]">
        {activeContent}
      </div>
    </div>
  );
}

export { Tabs };

