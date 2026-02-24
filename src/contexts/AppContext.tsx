import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Page, SettingsSectionId } from '@/types';

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
  setCurrentPage: (page: Page, options?: { settingsSection?: SettingsSectionId }) => void;
  setSettingsSection: (section: SettingsSectionId) => void;
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

  const toggleSidebar = () => {
    setAppState(prevState => ({
      ...prevState,
      isSidebarOpen: !prevState.isSidebarOpen,
    }));
  };

  const toggleTheme = () => {
    setAppState(prevState => ({
      ...prevState,
      theme: prevState.theme === 'light' ? 'dark' : 'light',
    }));
  };

  const setCurrentPage = (page: Page, options?: { settingsSection?: SettingsSectionId }) => {
    setAppState(prevState => ({
      ...prevState,
      currentPage: page,
      ...(page === 'settings' && options?.settingsSection != null && {
        settingsSection: options.settingsSection,
      }),
    }));
  };

  const setSettingsSection = (section: SettingsSectionId) => {
    setAppState(prevState => ({
      ...prevState,
      settingsSection: section,
    }));
  };

  return (
    <AppContext.Provider value={{ appState, setAppState, toggleSidebar, toggleTheme, setCurrentPage, setSettingsSection }}>
      {children}
    </AppContext.Provider>
  );
};
