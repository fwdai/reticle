import { List, Terminal, MessageSquare, Star, Clock, Archive } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { useTemplatesContext } from "@/contexts/TemplatesContext";

function TemplatesSidebar() {
  const { templates, filter, setFilter } = useTemplatesContext();

  const nonArchived = templates.filter((t) => t.archived_at == null);
  const archivedCount = templates.filter((t) => t.archived_at != null).length;
  const starredCount = nonArchived.filter((t) => t.is_pinned).length;

  return (
    <Sidebar title="Templates">
      <SidebarSection title="Type">
        <SidebarItem
          icon={List}
          label="All Templates"
          active={filter === "all"}
          onClick={() => setFilter("all")}
          count={nonArchived.length}
        />
        <SidebarItem
          icon={Terminal}
          label="System"
          active={filter === "system"}
          onClick={() => setFilter("system")}
          count={nonArchived.filter((t) => t.type === "system").length}
        />
        <SidebarItem
          icon={MessageSquare}
          label="User"
          active={filter === "user"}
          onClick={() => setFilter("user")}
          count={nonArchived.filter((t) => t.type === "user").length}
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
          count={nonArchived.filter((t) => t.last_used_at != null).length}
        />
        <SidebarItem
          icon={Archive}
          label="Archived"
          active={filter === "archived"}
          onClick={() => setFilter("archived")}
          count={archivedCount}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default TemplatesSidebar;
