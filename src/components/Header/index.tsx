import { ChevronDown, Play, Settings } from "lucide-react";
import "./Header.css";

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">AI</div>
        <h1>Workbench</h1>
        <span className="breadcrumb">/</span>
        <span className="breadcrumb">Simple Chat</span>
      </div>
      <div className="header-right">
        <button className="run-button">
          <Play size={16} />
          <span>Run</span>
        </button>
        <div className="production-dropdown">
          <button>
            <span>Production</span>
            <ChevronDown size={16} />
          </button>
        </div>
        <button className="settings-button">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}

export default Header;
