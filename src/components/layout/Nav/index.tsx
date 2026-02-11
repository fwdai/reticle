import { Radar, Home, Activity, Layers, Settings, PlayCircle } from "lucide-react";
import { Page } from "@/types";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow } from "@/components/ui/tooltip";
import { useAppContext } from "@/contexts/AppContext";

function Navigation() {
  const { appState, setCurrentPage } = useAppContext();
  const currentPage = appState.currentPage;
  const navItems = [
    { id: "home" as Page, icon: Home, label: "Home" },
    { id: "studio" as Page, icon: PlayCircle, label: "Scenarios " },
    { id: "templates" as Page, icon: Layers, label: "Templates" },
    // { id: "environments" as Page, icon: Layers, label: "Environments" },
    { id: "runs" as Page, icon: Activity, label: "Runs" },
  ];

  const handleClick = (page: Page, e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage(page);
  };

  return (
    <TooltipProvider>
      <nav className="w-16 bg-nav-dark flex flex-col items-center py-6 flex-shrink-0 z-20 rounded-xl mr-1.5 shadow-right">
        <div className="mb-8">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <Radar className="text-2xl font-bold" strokeWidth={1} size={24} />
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
                      } transition-colors flex items-center justify-center relative cursor-pointer`}
                  >
                    {isActive && (
                      <div className="absolute -left-0 w-1 h-6 bg-primary rounded-r-full"></div>
                    )}
                    <Icon size={20} className={isActive ? "text-white" : "text-white/40 hover:text-white/60 transition-colors"} />
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
        <div className="flex flex-col gap-6 w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => handleClick("settings", e)}
                className={`${currentPage === "settings" ? "text-white" : "text-white/40 hover:text-white"
                  } transition-colors flex items-center justify-center relative cursor-pointer`}
              >
                {currentPage === "settings" && (
                  <div className="absolute -left-0 w-1 h-6 bg-primary rounded-r-full"></div>
                )}
                <Settings size={20} className={currentPage === "settings" ? "text-white" : "text-white/40 hover:text-white/60 transition-colors"} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
              <TooltipArrow />
            </TooltipContent>
          </Tooltip>
          <div className="size-8 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer mx-auto">
            <img
              alt="Avatar"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkKKn7XRblGUMGxsqsk2XQ42Af2nXd9Zjvl6ghD9eD8LJeT2k6r_TWMMjk-oJNVZZOT5cLajAOXlUKrJmN7hOOt2LW9rqGGZ3X0mvRVaLOhk2Tvq9t5qvtOBOjTdlDYVb3Oy9y8Ny6tX9vRrDrIvvAcile489RHN_xKJI031AiWh319tpkbzybLFPPz7ruZIde-61-xLzT7reyL1CpztCIr11BVSuJ14kVe0kqFRuTQHDSdCo1ugXH1lIHPoP-Y45Ugq-l9kCSdbc"
            />
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}

export default Navigation;
