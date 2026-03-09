import { List, CheckCircle, AlertCircle, Clock } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import type { AgentFilterId } from "./index";

interface AgentsSidebarProps {
  filter: AgentFilterId;
  onFilterChange: (filter: AgentFilterId) => void;
  counts: { all: number; ready: number; "needs-config": number };
}

function AgentsSidebar({ filter, onFilterChange, counts }: AgentsSidebarProps) {
  return (
    <Sidebar title="Agents">
      <SidebarSection title="Status">
        <SidebarItem
          icon={List}
          label="All Agents"
          active={filter === "all"}
          onClick={() => onFilterChange("all")}
          count={counts.all}
        />
        <SidebarItem
          icon={CheckCircle}
          label="Ready"
          active={filter === "ready"}
          onClick={() => onFilterChange("ready")}
          count={counts.ready}
        />
        <SidebarItem
          icon={AlertCircle}
          label="Needs Config"
          active={filter === "needs-config"}
          onClick={() => onFilterChange("needs-config")}
          count={counts["needs-config"]}
        />
      </SidebarSection>
      <SidebarSection title="Quick Access">
        <SidebarItem
          icon={Clock}
          label="Recently Run"
          active={filter === "recently-run"}
          onClick={() => onFilterChange("recently-run")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default AgentsSidebar;
