import { useState, useEffect, useRef } from "react";
import { Home, Activity, Layers, Settings, FileCode, User, Zap, Wrench } from "lucide-react";
import reticleLogo from "@/assets/reticle-logo.svg";
import { Page, type SettingsSectionId } from "@/types";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow } from "@/components/ui/tooltip";
import { useAppContext } from "@/contexts/AppContext";
import { getOrCreateAccount } from "@/lib/storage";
import type { Account } from "@/types";

function getInitials(account: Account | null): string {
  if (!account) return "";
  const first = (account.first_name ?? "").trim();
  const last = (account.last_name ?? "").trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase();
  return "";
}

function Navigation() {
  const { appState, setCurrentPage } = useAppContext();
  const [account, setAccount] = useState<Account | null>(null);

  const prevPageRef = useRef(appState.currentPage);

  useEffect(() => {
    getOrCreateAccount().then(setAccount).catch(console.error);
  }, []);

  useEffect(() => {
    const prev = prevPageRef.current;
    prevPageRef.current = appState.currentPage;
    if (prev === "settings" && appState.currentPage !== "settings") {
      getOrCreateAccount().then(setAccount).catch(console.error);
    }
  }, [appState.currentPage]);

  const currentPage = appState.currentPage;
  const navItems = [
    { id: "home" as Page, icon: Home, label: "Home" },
    { id: "studio" as Page, icon: FileCode, label: "Scenarios" },
    { id: "agents" as Page, icon: Zap, label: "Agents" },
    { id: "tools" as Page, icon: Wrench, label: "Tools" },
    { id: "templates" as Page, icon: Layers, label: "Templates" },
    // { id: "environments" as Page, icon: Layers, label: "Environments" },
    { id: "runs" as Page, icon: Activity, label: "Runs" },
  ];

  const handleClick = (page: Page, e: React.MouseEvent, options?: { settingsSection?: SettingsSectionId }) => {
    e.preventDefault();
    setCurrentPage(page, options);
  };

  return (
    <TooltipProvider>
      <nav className="w-16 bg-nav-dark flex flex-col items-center py-3 flex-shrink-0 z-20 rounded-xl shadow-right">
        <div className="mb-8">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center overflow-hidden">
            <img src={reticleLogo} alt="Reticle" className="size-8" />
          </div>
        </div>
        <nav className="flex flex-col gap-6 flex-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handleClick(item.id, e)}
                    className={`${isActive ? "text-white" : "text-white/40 hover:text-white"
                      } transition-colors flex items-center justify-center relative cursor-pointer h-7`}
                  >
                    {isActive && (
                      <div className="absolute -left-0 w-1 h-6 bg-primary rounded-r-full"></div>
                    )}
                    <Icon size={22} className={isActive ? "text-white" : "text-white/40 hover:text-white/60 transition-colors"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                  <TooltipArrow />
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="flex flex-col gap-4 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => handleClick("settings", e, { settingsSection: "api-keys" })}
                className={`${currentPage === "settings" ? "text-white" : "text-white/40 hover:text-white"
                  } transition-colors flex items-center justify-center relative cursor-pointer h-7`}
              >
                {currentPage === "settings" && (
                  <div className="absolute -left-0 w-1 h-6 bg-primary rounded-r-full"></div>
                )}
                <Settings size={22} className={currentPage === "settings" ? "text-white" : "text-white/40 hover:text-white/60 transition-colors"} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => handleClick("settings", e, { settingsSection: "account" })}
                className="size-8 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer mx-auto flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                {account?.avatar ? (
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src={account.avatar}
                  />
                ) : getInitials(account) ? (
                  <span className="text-xs font-medium text-white/90">
                    {getInitials(account)}
                  </span>
                ) : (
                  <User size={18} className="text-white/60" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {account?.first_name || account?.last_name
                  ? [account.first_name, account.last_name].filter(Boolean).join(" ")
                  : "Account"}
              </p>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
        </div>
      </nav>
    </TooltipProvider>
  );
}

export default Navigation;
