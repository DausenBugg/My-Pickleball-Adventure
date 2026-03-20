import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { darkColors, lightColors, type AppColors } from './tokens';

const THEME_KEY = 'theme_preference'; // 'light' | 'dark' | 'system'

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode);
  };

  const isDark =
    mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value: ThemeContextValue = {
    colors: isDark ? darkColors : lightColors,
    isDark,
    mode,
    setMode,
  };

  // Keep provider mounted during bootstrap to avoid context/hook edge cases
  if (!loaded) {
    return (
      <ThemeContext.Provider
        value={{
          colors: lightColors,
          isDark: false,
          mode: 'system',
          setMode: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
