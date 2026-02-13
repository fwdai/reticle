import { useState } from "react";
import Sidebar from "@/components/Layout/Sidebar";

type SectionId = "preferences" | "account" | "api-keys" | "integrations";

function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("preferences");

  const navItemClass = (id: SectionId) =>
    `flex items-center px-4 py-1 text-sm text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer ${activeSection === id ? "bg-gray-200" : ""}`;

  return (
    <Sidebar title="Settings">
      <div className="space-y-6">
        <div>
          <div className="mb-2 pl-4 pr-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">General</h3>
          </div>
          <nav className="space-y-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("preferences");
              }}
              className={navItemClass("preferences")}
            >
              Preferences
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("account");
              }}
              className={navItemClass("account")}
            >
              Account
            </a>
          </nav>
        </div>
        <div>
          <div className="mb-2 pl-4 pr-3">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Advanced</h3>
          </div>
          <nav className="space-y-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("api-keys");
              }}
              className={navItemClass("api-keys")}
            >
              API Keys
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveSection("integrations");
              }}
              className={navItemClass("integrations")}
            >
              Integrations
            </a>
          </nav>
        </div>
      </div>
    </Sidebar>
  );
}

export default Settings;
