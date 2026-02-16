import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import Account from "./Account";
import ApiKeys from "./ApiKeys";
import Footer from "./Footer";
import Preferences from "./Preferences";
import type { SettingsSectionId } from "../index";

interface SettingsMainContentProps {
  activeSection: SettingsSectionId;
}

function SettingsMainContent({ activeSection }: SettingsMainContentProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "api-keys":
        return <ApiKeys />;
      case "account":
        return <Account />;
      case "integrations":
        return (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            Coming soon
          </div>
        );
      case "preferences":
      default:
        return <Preferences />;
    }
  };

  return (
    <MainContent>
      <Header section={activeSection} />
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto px-10 pt-10 pb-6 space-y-10 h-full">
          {renderContent()}
          <Footer />
        </div>
      </div>
    </MainContent>
  );
}

export default SettingsMainContent;