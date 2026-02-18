import { useState } from "react";
import { List } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";

function AgentsSidebar() {
  const [activeFilter, setActiveFilter] = useState<"all">("all");

  return (
    <Sidebar title="Agents">
      <SidebarSection title="Filters">
        <SidebarItem
          icon={List}
          label="All Agents"
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default AgentsSidebar;
