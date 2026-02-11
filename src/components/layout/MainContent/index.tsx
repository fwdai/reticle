import { ComponentType } from "react";
import Header from "../Header";
import { Page } from "@/types";
import Studio from "./Studio";
import Settings from "./Settings";
import Environments from "./Environments";
import Runs from "./Runs";
import TemplatesPage from "./Templates";

interface MainContentProps {
  currentPage: Page;
}

const pages: Partial<Record<Page, ComponentType>> = {
  studio: Studio,
  environments: Environments,
  runs: Runs,
  settings: Settings,
  templates: TemplatesPage,
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

