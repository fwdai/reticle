import { ComponentType } from "react";
import Navigation from "./components/Layout/Nav";
import { LoadingScreen } from "./components/LoadingScreen";
import Home from "./features/Home";
import Studio from "./features/Scenarios";
import Agents from "./features/Agents";
import Environments from "./features/Environments";
import Runs from "./features/Runs";
import Settings from "./features/Settings";
import Templates from "./features/Templates";
import Tools from "./features/Tools";
import { Page } from "./types";
import { useAppContext } from "./contexts/AppContext";
import "./App.css";

const pages: Partial<Record<Page, ComponentType>> = {
  home: Home,
  studio: Studio,
  agents: Agents,
  tools: Tools,
  environments: Environments,
  runs: Runs,
  settings: Settings,
  templates: Templates,
};

function App() {
  const { appState, isAppReady } = useAppContext();
  const PageComponent = pages[appState.currentPage] as ComponentType;

  if (!isAppReady) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden p-0.75 bg-sidebar-light animate-fade-in">
      <Navigation />
      <PageComponent />
    </div>
  );
}

export default App;
