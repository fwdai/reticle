import { Wrench, Braces, Zap, Terminal, Search, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { CATEGORIES, type Category } from "./constants";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  All: Wrench,
  Data: Braces,
  Communication: Zap,
  DevOps: Terminal,
  Search: Search,
  Custom: Tag,
};

interface ToolsSidebarProps {
  activeCategory: Category;
  categoryCounts: Record<string, number>;
  onCategoryChange: (category: Category) => void;
}

function ToolsSidebar({ activeCategory, categoryCounts, onCategoryChange }: ToolsSidebarProps) {
  return (
    <Sidebar title="Tools">
      <SidebarSection title="Categories">
        {CATEGORIES.map((cat) => (
          <SidebarItem
            key={cat}
            icon={CATEGORY_ICONS[cat]}
            label={cat}
            count={categoryCounts[cat] ?? 0}
            active={activeCategory === cat}
            onClick={() => onCategoryChange(cat)}
          />
        ))}
      </SidebarSection>
    </Sidebar>
  );
}

export default ToolsSidebar;
