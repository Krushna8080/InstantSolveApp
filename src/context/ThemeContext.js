import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { storageService } from '../services/storageService';

// Create the context
const ThemeContext = createContext();

// Define theme colors
const themes = {
  light: {
    primary: '#2563EB',
    secondary: '#9333EA',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    modes: {
      quick: '#3B82F6',
      logical: '#10B981',
      detailed: '#8B5CF6',
      image: '#F59E0B',
      creative: '#EC4899',
    },
  },
  dark: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    background: '#0B1120',
    surface: '#1A2333',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#2D3B4F',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#60A5FA',
    modes: {
      quick: '#60A5FA',
      logical: '#34D399',
      detailed: '#A78BFA',
      image: '#FBBF24',
      creative: '#F472B6',
    },
  },
};

// Create the provider component
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await storageService.getUserSettings();
        const savedTheme = settings?.theme;
        
        if (savedTheme) {
          setTheme(savedTheme);
          applyThemeToDocument(savedTheme);
        } else {
          const defaultTheme = systemColorScheme || 'light';
          setTheme(defaultTheme);
          applyThemeToDocument(defaultTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        const defaultTheme = systemColorScheme || 'light';
        setTheme(defaultTheme);
        applyThemeToDocument(defaultTheme);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const applyThemeToDocument = (newTheme) => {
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = themes[newTheme].background;
      document.body.style.color = themes[newTheme].text;
      document.documentElement.style.colorScheme = newTheme;
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyThemeToDocument(newTheme);
    
    try {
      await storageService.updateUserSettings({ theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Create the hook for using the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 