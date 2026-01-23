import { ComponentType } from "react";
import { Page } from "@/types";
import Studio from "./Studio";
import Settings from "./Settings";
import Home from "./Home";

interface HeaderProps {
  currentPage: Page;
}

const headers: Partial<Record<Page, ComponentType>> = {
  home: Home,
  studio: Studio,
  settings: Settings,
};

function Header({ currentPage }: HeaderProps) {
  const HeaderComponent = headers[currentPage];

  return HeaderComponent && <HeaderComponent />;
}

export default Header;

