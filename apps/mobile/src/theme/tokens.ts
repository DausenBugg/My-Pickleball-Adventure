export const colors = {
  ink: '#0b1a2b',
  muted: '#5a6a7d',
  blue: '#2b6cb0',
  coral: '#ff6b5a',
  surface: '#ffffff',
  background: '#f7f8fb',
  border: '#d6dbe3',
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
    lg: 24,
    xl: 28,
    xxl: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;
