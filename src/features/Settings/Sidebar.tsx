import { Settings as SettingsIcon, User, Key, Braces } from "lucide-react";

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
          data-testid="settings-nav-account"
        />
        <SidebarItem
          icon={Key}
          label="API Keys"
          active={activeSection === "api-keys"}
          onClick={() => onSectionChange("api-keys")}
          data-testid="settings-nav-api-keys"
        />
        <SidebarItem
          icon={SettingsIcon}
          label="Preferences"
          active={activeSection === "preferences"}
          onClick={() => onSectionChange("preferences")}
          data-testid="settings-nav-preferences"
        />
      </SidebarSection>
      <SidebarSection title="Advanced">
        <SidebarItem
          icon={Braces}
          label="Env Variables"
          active={activeSection === "env-variables"}
          onClick={() => onSectionChange("env-variables")}
          data-testid="settings-nav-env-variables"
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default SettingsSidebar;
