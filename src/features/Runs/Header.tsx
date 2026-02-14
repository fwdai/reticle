import { useState } from "react";
import { Search } from "lucide-react";

import Header from "@/components/Layout/Header";

function RunsHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Header>
      <div className="flex items-center gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-text-main">Runs History</h1>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Live monitoring</span>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
        <div className="relative flex-1 sm:flex-none min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
          <input
            className="pl-10 pr-4 py-2 bg-slate-50 border border-border-light rounded-xl text-sm w-full sm:w-80 focus:ring-primary-500 focus:border-primary-500 transition-all"
            placeholder="Search scenario, ID, or user..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </Header>
  );
}

export default RunsHeader;
