import Header from "@/components/Layout/Header";
import type { SettingsSectionId } from "./index";

const SECTION_TITLES: Record<SettingsSectionId, string> = {
  account: "Account",
  preferences: "Preferences",
  "api-keys": "API Keys",
  integrations: "Integrations",
};

interface SettingsHeaderProps {
  section: SettingsSectionId;
}

function SettingsHeader({ section }: SettingsHeaderProps) {
  const title = SECTION_TITLES[section] ?? "Settings";
  return (
    <Header>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
    </Header>
  );
}

export default SettingsHeader;
