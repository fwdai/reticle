import { useState } from "react";
import { Share2, Pencil, Plus } from "lucide-react";

import Header from "@/components/Layout/Header";

function EnvironmentsHeader() {
  const [selectedEnvironment] = useState("Production");

  return (
    <Header>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-text-muted">Environments</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-text-main">{selectedEnvironment}</span>
        <span className="bg-indigo-50 text-[10px] text-primary font-bold px-2 py-0.5 rounded-full border border-indigo-100 ml-2 uppercase tracking-tight">
          System Environment
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-muted hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors border border-border-light bg-white">
          <Share2 className="size-4" />
          Share
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-muted hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors border border-border-light bg-white">
          <Pencil className="size-4" />
          Edit
        </button>
        <div className="h-6 w-px bg-border-light mx-1"></div>
        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm">
          <Plus className="size-4" />
          Add Variable
        </button>
      </div>
    </Header>
  );
}

export default EnvironmentsHeader;
