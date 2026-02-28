import { useState } from "react";
import { List } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";

function ToolsSidebar() {
  const [activeFilter, setActiveFilter] = useState<"all">("all");

  return (
    <Sidebar title="Tools">
      <SidebarSection title="Filters">
        <SidebarItem
          icon={List}
          label="All Tools"
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default ToolsSidebar;
