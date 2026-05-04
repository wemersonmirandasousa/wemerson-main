
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppThemeMode } from '@/types/theme';

interface WorkflowThemeContextType {
  theme: AppThemeMode;
  setTheme: (theme: AppThemeMode) => void;
}

const WorkflowThemeContext = createContext<WorkflowThemeContextType | undefined>(undefined);

export const WorkflowThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppThemeMode>(() => {
    const saved = localStorage.getItem('workflow-theme-mode');
    const initial = (saved as AppThemeMode) || 'escuro';
    console.log('[WorkflowTheme:init]', initial);
    return initial;
  });

  const setTheme = (newTheme: AppThemeMode) => {
    console.log('[ThemeSwitcher:change-theme]', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('workflow-theme-mode', newTheme);
  };

  useEffect(() => {
    // Sync with HTML class if needed, or just let components handle it via tokens
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'claro') {
      root.classList.add('light');
    } else if (theme === 'escuro') {
      root.classList.add('dark');
    }
    // 'colorido' can be handled by components specifically or also map to light/dark base
  }, [theme]);

  return (
    <WorkflowThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </WorkflowThemeContext.Provider>
  );
};

export const useWorkflowTheme = () => {
  const context = useContext(WorkflowThemeContext);
  if (context === undefined) {
    throw new Error('useWorkflowTheme must be used within a WorkflowThemeProvider');
  }
  return context;
};
