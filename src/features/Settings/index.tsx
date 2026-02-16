import { useState } from "react";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

export type SettingsSectionId =
  | "preferences"
  | "account"
  | "api-keys"
  | "integrations";

function SettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("account");

  return (
    <>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <MainContent activeSection={activeSection} />
    </>
  );
}

export default SettingsPage;
