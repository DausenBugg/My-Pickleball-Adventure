// ── Palette ──────────────────────────────────────────────
export const palette = {
  blue: '#1a73e8',
  blueDark: '#1557b0',
  blueLight: '#4a9af5',
  coral: '#ff4538',
  coralDark: '#d63a30',
  coralLight: '#ff7a70',
  green: '#0fa958',
  gold: '#f5a623',
  white: '#ffffff',
  black: '#000000',
} as const;

// ── Semantic color tokens (light) ────────────────────────
export const lightColors = {
  // Core
  primary: palette.blue,
  primaryLight: palette.blueLight,
  primaryDark: palette.blueDark,
  secondary: palette.coral,
  secondaryLight: palette.coralLight,
  secondaryDark: palette.coralDark,

  // Text
  ink: '#0b1a2b',
  muted: '#5a6a7d',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#ffffff',

  // Surfaces
  surface: '#ffffff',
  background: '#f0f2f8',
  cardBackground: '#ffffff',

  // Borders
  border: '#d6dbe3',
  borderLight: '#e8ecf3',

  // Feedback
  success: palette.green,
  warning: palette.gold,
  error: palette.coral,

  // Ghost / tinted backgrounds
  primaryGhost: 'rgba(26, 115, 232, 0.10)',
  secondaryGhost: 'rgba(255, 69, 56, 0.10)',
  successGhost: 'rgba(52, 199, 89, 0.12)',

  // Tab bar
  tabBarBackground: palette.blue,
  tabBarActive: '#ffffff',
  tabBarInactive: 'rgba(255,255,255,0.55)',

  // Misc
  overlay: 'rgba(5, 10, 20, 0.45)',
  shimmer: 'rgba(26, 115, 232, 0.08)',
  winBg: '#e7f6ef',
  lossBg: '#ffecec',
  unreadBg: '#eef4ff',
  unreadBorder: palette.blue,

  // Legacy compat aliases
  blue: palette.blue,
  coral: palette.coral,
} as const;

// ── Semantic color tokens (dark) ─────────────────────────
export const darkColors: typeof lightColors = {
  primary: palette.blueLight,
  primaryLight: '#6db3ff',
  primaryDark: palette.blue,
  secondary: palette.coralLight,
  secondaryLight: '#ffa39d',
  secondaryDark: palette.coral,

  ink: '#e6edf5',
  muted: '#8b99ab',
  textOnPrimary: '#0d1117',
  textOnSecondary: '#0d1117',

  surface: '#161b22',
  background: '#0d1117',
  cardBackground: '#1c2333',

  border: '#2d3748',
  borderLight: '#232d3f',

  success: '#34d27b',
  warning: '#f5c04a',
  error: palette.coralLight,

  primaryGhost: 'rgba(74, 154, 245, 0.14)',
  secondaryGhost: 'rgba(255, 136, 128, 0.14)',
  successGhost: 'rgba(52, 210, 123, 0.14)',

  tabBarBackground: '#161b22',
  tabBarActive: palette.blueLight,
  tabBarInactive: 'rgba(139,153,171,0.6)',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: 'rgba(74, 154, 245, 0.12)',
  winBg: '#132a1e',
  lossBg: '#2e1515',
  unreadBg: '#151e30',
  unreadBorder: palette.blueLight,

  blue: palette.blueLight,
  coral: palette.coralLight,
} as const;

// Backwards-compat: default to light
export const colors = lightColors;

export type AppColors = typeof lightColors;

// ── Spacing ──────────────────────────────────────────────
export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

// ── Radii (playful & rounded) ────────────────────────────
export const radii = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

// ── Typography ───────────────────────────────────────────
export const typography = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 24,
    xl: 28,
    xxl: 32,
    hero: 42,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
} as const;

// ── Shadows ──────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
