import React from "react";

interface TabPanelProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}

function TabPanel({ children }: TabPanelProps) {
  return <>{children}</>;
}

export default TabPanel;
