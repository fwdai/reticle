import React from "react";

interface TabPanelProps {
  title: string;
  children: React.ReactNode;
}

function TabPanel({ children }: TabPanelProps) {
  return <>{children}</>;
}

export default TabPanel;
