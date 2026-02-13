import { useState } from "react";
import Sidebar from "@/components/Layout/Sidebar";

type FilterId = "all" | "recent";

function Runs() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  return (
    <Sidebar title="Runs">
      <div>
        <div className="mb-2 pl-4 pr-3">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Filters</h3>
        </div>
        <nav className="space-y-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveFilter("all");
            }}
            className={`flex items-center px-4 py-1 text-sm text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer ${activeFilter === "all" ? "bg-gray-200" : ""}`}
          >
            All Runs
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveFilter("recent");
            }}
            className={`flex items-center px-4 py-1 text-sm text-sidebar-text hover:bg-gray-200 transition-colors cursor-pointer ${activeFilter === "recent" ? "bg-gray-200" : ""}`}
          >
            Recent
          </a>
        </nav>
      </div>
    </Sidebar>
  );
}

export default Runs;
