import { ComponentType } from "react";
import Header from "../Header";
import { Page } from "@/types";
import Home from "./Home";
import Studio from "./Studio";
import Settings from "./Settings";
import Environments from "./Environments";
import Runs from "./Runs";

interface MainContentProps {
  currentPage: Page;
}

const pages: Partial<Record<Page, ComponentType>> = {
  home: Home,
  studio: Studio,
  environments: Environments,
  runs: Runs,
  settings: Settings,
};

function MainContent({ currentPage }: MainContentProps) {
  const PageComponent = pages[currentPage];

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white border border-border-light rounded-xl">
      <Header currentPage={currentPage} />
      {PageComponent && <PageComponent />}
    </main>
  );
}

export default MainContent;

