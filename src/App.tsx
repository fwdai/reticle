import { useState } from "react";
import LeftNav from "./components/layout/LeftNav";
import Sidebar from "./components/layout/Sidebar";
import MainContent from "./components/layout/MainContent";
import { Page } from "./types";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("studio");

  return (
    <div className="flex h-screen w-full overflow-hidden p-[3px] bg-sidebar-light">
      <LeftNav currentPage={currentPage} onNavigate={setCurrentPage} />
      <Sidebar currentPage={currentPage} />
      <MainContent currentPage={currentPage} />
    </div>
  );
}

export default App;
