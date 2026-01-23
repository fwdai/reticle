import { ComponentType } from "react";
import { Page } from "@/types";
import Studio from "./Studio";
import Settings from "./Settings";
import Runs from "./Runs";
import Environments from "./Environments";

interface SidebarProps {
  currentPage: Page;
}

const sidebars: Partial<Record<Page, ComponentType>> = {
  studio: Studio,
  settings: Settings,
  runs: Runs,
  enviroments: Environments,
};

function Sidebar({ currentPage }: SidebarProps) {
  const SidebarComponent = sidebars[currentPage];
  if (currentPage === "home") return null;

  return (
    <aside className="w-60 bg-sidebar-light flex flex-col flex-shrink-0 mr-1.5">
      <div className="p-3">
        {SidebarComponent && <SidebarComponent />}
      </div>
    </aside>
  )
}

export default Sidebar;

