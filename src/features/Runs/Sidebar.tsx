import { useState } from "react";
import { List, Clock } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";

type FilterId = "all" | "recent";

function Runs() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  return (
    <Sidebar title="Runs">
      <SidebarSection title="Filters">
        <SidebarItem
          icon={List}
          label="All Runs"
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />
        <SidebarItem
          icon={Clock}
          label="Recent"
          active={activeFilter === "recent"}
          onClick={() => setActiveFilter("recent")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default Runs;
