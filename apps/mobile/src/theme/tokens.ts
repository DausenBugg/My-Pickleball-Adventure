export const colors = {
  ink: '#0b1220',
  muted: '#5b6b80',
  blue: '#4bb3ff',
  blueDark: '#1f7edb',
  blueSoft: '#e6f4ff',
  coral: '#ff6f5e',
  coralDark: '#e65544',
  coralSoft: '#fff0ec',
  surface: '#ffffff',
  background: '#f6f8fb',
  panel: '#fdf7f2',
  border: '#d9e1ee',
  shadow: '#0b1220',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 22,
    xl: 28,
    xxl: 36,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  families: {
    regular: 'SpaceGrotesk_400Regular',
    medium: 'SpaceGrotesk_500Medium',
    semibold: 'SpaceGrotesk_600SemiBold',
    bold: 'SpaceGrotesk_700Bold',
  },
} as const;
