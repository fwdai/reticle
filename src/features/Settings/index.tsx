import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import { useAppContext } from "@/contexts/AppContext";
import type { SettingsSectionId } from "@/types";

export type { SettingsSectionId };

function SettingsPage() {
  const { appState, setSettingsSection } = useAppContext();
  const activeSection = appState.settingsSection;

  return (
    <>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setSettingsSection}
      />
      <MainContent activeSection={activeSection} />
    </>
  );
}

export default SettingsPage;
