import { useState, ComponentType } from "react";
import LeftNav from "./components/Layout/LeftNav";
import Home from "./features/Home";
import Studio from "./features/Studio";
import Environments from "./features/Environments";
import Runs from "./features/Runs";
import Settings from "./features/Settings";
import Templates from "./features/Tempaltes";
import { Page } from "./types";
import "./App.css";


const pages: Partial<Record<Page, ComponentType>> = {
  home: Home,
  studio: Studio,
  environments: Environments,
  runs: Runs,
  settings: Settings,
  templates: Templates,
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("studio");
  const PageComponent = pages[currentPage] as ComponentType;

  return (
    <div className="flex h-screen w-full overflow-hidden p-[3px] bg-sidebar-light">
      <LeftNav currentPage={currentPage} onNavigate={setCurrentPage} />
      <PageComponent />
    </div>
  );
}

export default App;
