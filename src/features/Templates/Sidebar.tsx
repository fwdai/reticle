import { List, Terminal, MessageSquare, Star, Clock } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { useTemplatesContext } from "@/contexts/TemplatesContext";

function TemplatesSidebar() {
  const { templates, filter, setFilter } = useTemplatesContext();

  const starredCount = templates.filter((t) => t.is_pinned).length;

  return (
    <Sidebar title="Templates">
      <SidebarSection title="Type">
        <SidebarItem
          icon={List}
          label="All Templates"
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={templates.length}
        />
        <SidebarItem
          icon={Terminal}
          label="System"
          active={filter === "system"}
          onClick={() => setFilter("system")}
          count={templates.filter((t) => t.type === "system").length}
        />
        <SidebarItem
          icon={MessageSquare}
          label="User"
          active={filter === "user"}
          onClick={() => setFilter("user")}
          count={templates.filter((t) => t.type === "user").length}
        />
      </SidebarSection>
      <SidebarSection title="Quick Access">
        <SidebarItem
          icon={Star}
          label="Starred"
          active={filter === "starred"}
          onClick={() => setFilter("starred")}
          count={starredCount}
        />
        <SidebarItem
          icon={Clock}
          label="Recently Used"
          active={filter === "recently_used"}
          onClick={() => setFilter("recently_used")}
          count={templates.length}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default TemplatesSidebar;
