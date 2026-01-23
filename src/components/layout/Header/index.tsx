import { ComponentType } from "react";
import { Page } from "@/types";
import Studio from "./Studio";
import Settings from "./Settings";
import Home from "./Home";
import Environments from "./Environments";
import Runs from "./Runs";

interface HeaderProps {
  currentPage: Page;
}

const headers: Partial<Record<Page, ComponentType>> = {
  home: Home,
  environments: Environments,
  runs: Runs,
  studio: Studio,
  settings: Settings,
};

function Header({ currentPage }: HeaderProps) {
  const HeaderComponent = headers[currentPage];

  return (
    <header className="h-14 border-b border-border-light flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-xl">
      {HeaderComponent && <HeaderComponent />}
    </header>
  );
}

export default Header;

