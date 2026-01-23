import { ComponentType } from "react";
import { Page } from "@/types";
import StudioHeader from "./StudioHeader";
import SettingsHeader from "./SettingsHeader";
import HomeHeader from "./HomeHeader";

interface HeaderProps {
  currentPage: Page;
}

const headers: Partial<Record<Page, ComponentType>> = {
  home: HomeHeader,
  studio: StudioHeader,
  settings: SettingsHeader,
};

function Header({ currentPage }: HeaderProps) {
  const HeaderComponent = headers[currentPage];

  return HeaderComponent && <HeaderComponent />;
}

export default Header;

