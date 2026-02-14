import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import { AppTheme, darkTheme, lightTheme } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'app_theme_mode';

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveMode(mode: ThemeMode, systemMode: ColorSchemeName): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return systemMode === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemMode = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(STORAGE_KEY, nextMode);
  };

  const resolved = resolveMode(mode, systemMode);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      mode,
      setMode,
      isDark: resolved === 'dark',
    }),
    [mode, resolved]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}
