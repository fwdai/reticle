import React from "react";

interface TabPanelProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

function TabPanel({ children }: TabPanelProps) {
  return <>{children}</>;
}

export default TabPanel;
