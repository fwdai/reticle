import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { TELEMETRY_EVENTS, trackEvent } from '@/lib/telemetry';
import { Page, SettingsSectionId } from '@/types';
import { hasApiKeys, listScenarios, listAgents, listExecutions } from '@/lib/storage';

/** Onboarding status computed at startup; used by Home to avoid duplicate fetches */
export interface OnboardingStatus {
  isLoading: boolean;
  hasApiKey: boolean;
  hasScenarioOrAgent: boolean;
  hasCompletedRun: boolean;
  isComplete: boolean;
}

// Define the shape of the global application state
interface AppState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  currentPage: Page;
  settingsSection: SettingsSectionId;
  /** Default provider/model from settings; used when creating new scenarios */
  defaultProvider: string | null;
  defaultModel: string | null;
}

// Define the shape of the context object
interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setCurrentPage: (
    page: Page,
    options?: { settingsSection?: SettingsSectionId }
  ) => void;
  setSettingsSection: (section: SettingsSectionId) => void;
  /** True when all startup data has been loaded */
  isAppReady: boolean;
  /** Onboarding status from startup; available when isAppReady */
  onboardingStatus: OnboardingStatus | null;
  /** Re-run onboarding check (e.g. when returning to Home after adding API key) */
  refreshOnboardingStatus: () => Promise<void>;
}

// Create the AppContext
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// AppProvider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>({
    isSidebarOpen: true,
    theme: 'light',
    currentPage: 'home',
    settingsSection: 'api-keys',
    defaultProvider: null,
    defaultModel: null,
  });
  const [isAppReady, setIsAppReady] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);

  async function loadOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const [apiKeys, scenarios, agents, executions] = await Promise.all([
        hasApiKeys(),
        listScenarios(),
        listAgents(),
        listExecutions({ limit: 100 }),
      ]);

      const hasScenarioOrAgent = scenarios.length > 0 || agents.length > 0;
      const hasCompletedRun = executions.some(
        (e) => e.status === 'succeeded' && e.started_at != null
      );

      return {
        isLoading: false,
        hasApiKey: apiKeys,
        hasScenarioOrAgent,
        hasCompletedRun,
        isComplete: apiKeys && hasScenarioOrAgent && hasCompletedRun,
      };
    } catch {
      return {
        isLoading: false,
        hasApiKey: false,
        hasScenarioOrAgent: false,
        hasCompletedRun: false,
        isComplete: false,
      };
    }
  }

  const refreshOnboardingStatus = React.useCallback(async () => {
    const status = await loadOnboardingStatus();
    setOnboardingStatus(status);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStartupData() {
      const [onboarding] = await Promise.all([
        loadOnboardingStatus(),
        // Add more startup data loaders here as needed
      ]);

      if (!cancelled) {
        setOnboardingStatus(onboarding);
        setIsAppReady(true);
      }
    }

    loadStartupData();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSidebar = () => {
    setAppState((prevState) => ({
      ...prevState,
      isSidebarOpen: !prevState.isSidebarOpen,
    }));
  };

  const toggleTheme = () => {
    setAppState((prevState) => ({
      ...prevState,
      theme: prevState.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const setCurrentPage = (
    page: Page,
    options?: { settingsSection?: SettingsSectionId }
  ) => {
    setAppState((prevState) => {
      const nextState = {
        ...prevState,
        currentPage: page,
        ...(page === 'settings' &&
          options?.settingsSection != null && {
            settingsSection: options.settingsSection,
          }),
      };

      if (prevState.currentPage !== page) {
        trackEvent(TELEMETRY_EVENTS.PAGE_NAVIGATED, {
          from_page: prevState.currentPage,
          to_page: page,
          settings_section: options?.settingsSection,
        });
      }

      return nextState;
    });
  };

  const setSettingsSection = (section: SettingsSectionId) => {
    setAppState((prevState) => ({
      ...prevState,
      settingsSection: section,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        appState,
        setAppState,
        toggleSidebar,
        toggleTheme,
        setCurrentPage,
        setSettingsSection,
        isAppReady,
        onboardingStatus,
        refreshOnboardingStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
