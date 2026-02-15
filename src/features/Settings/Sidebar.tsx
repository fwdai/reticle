import { useState } from "react";
import { Settings as SettingsIcon, User, Key, Plug } from "lucide-react";

import Sidebar, { SidebarSection, SidebarItem } from "@/components/Layout/Sidebar";

type SectionId = "preferences" | "account" | "api-keys" | "integrations";

function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("preferences");

  return (
    <Sidebar title="Settings">
      <SidebarSection title="General">
        <SidebarItem
          icon={SettingsIcon}
          label="Preferences"
          active={activeSection === "preferences"}
          onClick={() => setActiveSection("preferences")}
        />
        <SidebarItem
          icon={User}
          label="Account"
          active={activeSection === "account"}
          onClick={() => setActiveSection("account")}
        />
      </SidebarSection>
      <SidebarSection title="Advanced">
        <SidebarItem
          icon={Key}
          label="API Keys"
          active={activeSection === "api-keys"}
          onClick={() => setActiveSection("api-keys")}
        />
        <SidebarItem
          icon={Plug}
          label="Integrations"
          active={activeSection === "integrations"}
          onClick={() => setActiveSection("integrations")}
        />
      </SidebarSection>
    </Sidebar>
  );
}

export default Settings;
