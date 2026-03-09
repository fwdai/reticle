import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";

import OnboardingView from "./OnboardingView";
import { DashboardView } from "./Dashboard";
import { useAppContext } from "@/contexts/AppContext";

function HomePage() {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const { onboardingStatus, refreshOnboardingStatus, skipProfileSetup } = useAppContext();

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  // Refresh onboarding when Home is shown (keeps data fresh after Settings/Studio changes)
  useEffect(() => {
    refreshOnboardingStatus();
  }, [refreshOnboardingStatus]);

  // onboardingStatus is set by AppContext startup before isAppReady becomes true
  if (!onboardingStatus) {
    return null;
  }
  const onboarding = onboardingStatus;

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden ml-2">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1200px] mx-auto px-10 py-12">
          {onboarding.isComplete ? (
            <DashboardView />
          ) : (
            <OnboardingView
              appVersion={appVersion}
              hasApiKey={onboarding.hasApiKey}
              hasCompletedRun={onboarding.hasCompletedRun}
              hasProfile={onboarding.hasProfile}
              onSkipProfile={skipProfileSetup}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
