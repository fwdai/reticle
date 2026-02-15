import { Plus, Filter, FileCode, FolderOpen, Star, Clock } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useTemplatesContext } from "@/contexts/TemplatesContext";

function TemplatesSidebar() {
  const {
    templates,
    typeFilter,
    setTypeFilter,
    onCreateTemplate,
  } = useTemplatesContext();

  const starredCount = templates.filter((t) => t.is_pinned).length;
  const recentlyUsedCount = templates.filter((t) => t.last_used_at != null).length;

  return (
    <Sidebar title="Templates">
      <SidebarSection title="Type Filter">
        <SidebarItem
          icon={Filter}
          label="All Templates"
          active={typeFilter === "all"}
          onClick={() => setTypeFilter("all")}
          count={templates.length}
        />
        <SidebarItem
          icon={FileCode}
          label="System"
          active={typeFilter === "system"}
          onClick={() => setTypeFilter("system")}
          count={templates.filter((t) => t.type === "system").length}
        />
        <SidebarItem
          icon={FileCode}
          label="User"
          active={typeFilter === "user"}
          onClick={() => setTypeFilter("user")}
          count={templates.filter((t) => t.type === "user").length}
        />
      </SidebarSection>
      <SidebarSection title="Quick Access">
        <SidebarItem
          icon={Star}
          label="Starred"
          count={starredCount}
        />
        <SidebarItem
          icon={Clock}
          label="Recently Used"
          count={recentlyUsedCount}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default TemplatesSidebar;
