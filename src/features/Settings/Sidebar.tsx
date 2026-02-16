import { Settings as SettingsIcon, User, Key, Plug } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";
import type { SettingsSectionId } from "./index";

interface SettingsSidebarProps {
  activeSection: SettingsSectionId;
  onSectionChange: (section: SettingsSectionId) => void;
}

function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <Sidebar title="Settings">
      <SidebarSection title="General">
        <SidebarItem
          icon={User}
          label="Account"
          active={activeSection === "account"}
          onClick={() => onSectionChange("account")}
        />
        <SidebarItem
          icon={SettingsIcon}
          label="Preferences"
          active={activeSection === "preferences"}
          onClick={() => onSectionChange("preferences")}
        />
        <SidebarItem
          icon={Key}
          label="API Keys"
          active={activeSection === "api-keys"}
          onClick={() => onSectionChange("api-keys")}
        />
      </SidebarSection>
      <SidebarSection title="Advanced">
        <SidebarItem
          icon={Plug}
          label="Integrations"
          active={activeSection === "integrations"}
          onClick={() => onSectionChange("integrations")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default SettingsSidebar;
