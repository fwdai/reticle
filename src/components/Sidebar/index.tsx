import { Plus, PanelLeft, Search, ChevronDown, ChevronRight, Folder, File } from "lucide-react";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-buttons">
        <button className="sidebar-button active">
          <PanelLeft size={16} />
          <span>LLM</span>
        </button>
        <button className="sidebar-button">
          <PanelLeft size={16} />
          <span>MCP</span>
        </button>
      </div>
      <div className="collections-header">
        <h2>Collections</h2>
        <div>
          <button>
            <Plus size={16} />
          </button>
          <button>
            <PanelLeft size={16} />
          </button>
        </div>
      </div>
      <div className="search-bar">
        <Search size={16} />
        <input type="text" placeholder="Search..." />
      </div>
      <div className="collections-tree">
        <ul>
          <li>
            <ChevronRight size={16} />
            <Folder size={16} />
            <span>Getting Started</span>
            <span className="file-count">1</span>
          </li>
          <li>
            <ChevronRight size={16} />
            <Folder size={16} />
            <span>Content Generation</span>
            <span className="file-count">2</span>
          </li>
          <li>
            <ChevronDown size={16} />
            <Folder size={16} />
            <span>Code Assistance</span>
            <span className="file-count">1</span>
            <ul>
              <li>
                <File size={16} />
                <span>Code Review</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
