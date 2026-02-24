import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

import OnboardingView from "./OnboardingView";
import { DashboardView } from "./Dashboard";
import { useOnboardingStatus } from "./useOnboardingStatus";

function HomePage() {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const onboarding = useOnboardingStatus();

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden ml-2">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1200px] mx-auto px-10 py-12">
          {onboarding.isLoading ? (
            <div className="flex items-center justify-center min-h-[300px] text-slate-500">
              Loading…
            </div>
          ) : onboarding.isComplete ? (
            <DashboardView />
          ) : (
            <OnboardingView
              appVersion={appVersion}
              hasApiKey={onboarding.hasApiKey}
              hasScenarioOrAgent={onboarding.hasScenarioOrAgent}
              hasCompletedRun={onboarding.hasCompletedRun}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
