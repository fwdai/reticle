import { List, Zap, FileCode, XCircle } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import type { RunFilterId } from "./index";

interface RunsSidebarProps {
  activeFilter: RunFilterId;
  onFilterChange: (filter: RunFilterId) => void;
  counts: { all: number; agents: number; scenarios: number; failed: number };
}

function RunsSidebar({ activeFilter, onFilterChange, counts }: RunsSidebarProps) {
  return (
    <Sidebar title="Runs">
      <SidebarSection title="Type">
        <SidebarItem
          icon={List}
          label="All Runs"
          active={activeFilter === "all"}
          onClick={() => onFilterChange("all")}
          count={counts.all}
        />
        <SidebarItem
          icon={Zap}
          label="Agents"
          active={activeFilter === "agents"}
          onClick={() => onFilterChange("agents")}
          count={counts.agents}
        />
        <SidebarItem
          icon={FileCode}
          label="Scenarios"
          active={activeFilter === "scenarios"}
          onClick={() => onFilterChange("scenarios")}
          count={counts.scenarios}
        />
      </SidebarSection>
      <SidebarSection title="Quick Access">
        <SidebarItem
          icon={XCircle}
          label="Failed"
          active={activeFilter === "failed"}
          onClick={() => onFilterChange("failed")}
          count={counts.failed}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default RunsSidebar;
