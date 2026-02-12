import { ComponentType } from "react";
import Navigation from "./components/layout/Nav/index";
import Home from "./features/Home";
import Studio from "./features/Studio";
import Environments from "./features/Environments";
import Runs from "./features/Runs";
import Settings from "./features/Settings";
import Templates from "./features/Tempaltes";
import { Page } from "./types";
import { useAppContext } from "./contexts/AppContext";
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
  const { appState } = useAppContext();
  const PageComponent = pages[appState.currentPage] as ComponentType;

  return (
    <div className="flex h-screen w-full overflow-hidden p-0.75 bg-sidebar-light">
      <Navigation />
      <PageComponent />
    </div>
  );
}

export default App;
