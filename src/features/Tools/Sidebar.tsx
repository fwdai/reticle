import {
  List,
  Search,
  Globe,
  Database,
  FolderOpen,
  Terminal,
  MessageSquare,
  Sparkles,
  Wrench,
  Puzzle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import { CATEGORIES, type Category } from "./constants";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  All: List,
  Search: Search,
  "HTTP / API": Globe,
  Database: Database,
  "File System": FolderOpen,
  "Shell / CLI": Terminal,
  Communication: MessageSquare,
  AI: Sparkles,
  Utility: Wrench,
  Custom: Puzzle,
};

interface ToolsSidebarProps {
  activeCategory: Category;
  categoryCounts: Record<string, number>;
  onCategoryChange: (category: Category) => void;
}

function ToolsSidebar({ activeCategory, categoryCounts, onCategoryChange }: ToolsSidebarProps) {
  return (
    <Sidebar title="Tools">
      <SidebarSection title="Filters">
        {CATEGORIES.filter((cat) => cat === "All" || (categoryCounts[cat] ?? 0) > 0).map((cat) => (
          <SidebarItem
            key={cat}
            icon={CATEGORY_ICONS[cat]}
            label={cat === "All" ? "All Tools" : cat}
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
