import { List, Braces, Terminal, Unlink } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import type { ToolFilterId } from "./index";

interface ToolsSidebarProps {
  filter: ToolFilterId;
  onFilterChange: (filter: ToolFilterId) => void;
}

function ToolsSidebar({ filter, onFilterChange }: ToolsSidebarProps) {
  return (
    <Sidebar title="Tools">
      <SidebarSection title="Type">
        <SidebarItem
          icon={List}
          label="All Tools"
          active={filter === "all"}
          onClick={() => onFilterChange("all")}
        />
        <SidebarItem
          icon={Braces}
          label="JSON Mock"
          active={filter === "json"}
          onClick={() => onFilterChange("json")}
        />
        <SidebarItem
          icon={Terminal}
          label="Code"
          active={filter === "code"}
          onClick={() => onFilterChange("code")}
        />
      </SidebarSection>
      <SidebarSection title="Quick Access">
        <SidebarItem
          icon={Unlink}
          label="Unused"
          active={filter === "unused"}
          onClick={() => onFilterChange("unused")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default ToolsSidebar;
