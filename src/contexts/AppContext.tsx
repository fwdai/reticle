import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Page } from '@/types';

// Define the shape of the global application state
interface AppState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  currentPage: Page; // Added currentPage
  // Add other global state here as needed
}

// Define the shape of the context object
interface AppContextType {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setCurrentPage: (page: Page) => void; // Added setCurrentPage
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
    isSidebarOpen: true, // Default to open
    theme: 'light',      // Default theme
    currentPage: 'studio', // Initial page
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

  const setCurrentPage = (page: Page) => {
    setAppState(prevState => ({
      ...prevState,
      currentPage: page,
    }));
  };

  return (
    <AppContext.Provider value={{ appState, setAppState, toggleSidebar, toggleTheme, setCurrentPage }}>
      {children}
    </AppContext.Provider>
  );
};
