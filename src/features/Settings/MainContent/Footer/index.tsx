import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

function SettingsFooter() {
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8 border-t border-slate-100">
      <div className="flex gap-8 mb-4 md:mb-0">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 bg-blue-500 rounded-full" /> v
          {appVersion ?? "…"}
        </span>
      </div>
      <div className="flex gap-6">
        <a className="hover:text-primary transition-colors" href="#">
          Privacy Policy
        </a>
        <a className="hover:text-primary transition-colors" href="#">
          Terms of Service
        </a>
      </div>
    </div>
  );
}

export default SettingsFooter;
