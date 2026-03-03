import { List, Zap, FileCode, XCircle } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import type { RunFilterId } from "./index";

interface RunsSidebarProps {
  activeFilter: RunFilterId;
  onFilterChange: (filter: RunFilterId) => void;
}

function RunsSidebar({ activeFilter, onFilterChange }: RunsSidebarProps) {
  return (
    <Sidebar title="Runs">
      <SidebarSection title="Type">
        <SidebarItem
          icon={List}
          label="All Runs"
          active={activeFilter === "all"}
          onClick={() => onFilterChange("all")}
        />
        <SidebarItem
          icon={Zap}
          label="Agents"
          active={activeFilter === "agents"}
          onClick={() => onFilterChange("agents")}
        />
        <SidebarItem
          icon={FileCode}
          label="Scenarios"
          active={activeFilter === "scenarios"}
          onClick={() => onFilterChange("scenarios")}
        />
      </SidebarSection>
      <SidebarSection title="Status">
        <SidebarItem
          icon={XCircle}
          label="Failed"
          active={activeFilter === "failed"}
          onClick={() => onFilterChange("failed")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default RunsSidebar;
