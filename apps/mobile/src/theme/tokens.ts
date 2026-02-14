export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

type ThemeRoleColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceGlass: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  overlay: string;
  tabBar: string;
  tabBarBorder: string;
};

export type AppTheme = {
  color: {
    brand: {
      sky: ColorScale;
      coral: ColorScale;
      neutral: ColorScale;
    };
    role: ThemeRoleColors;
  };
  spacing: typeof spacing;
  radius: typeof radius;
  type: typeof type;
  elevation: typeof elevation;
  motion: typeof motion;
};

const sky: ColorScale = {
  50: '#E7F8FF',
  100: '#CFF0FE',
  200: '#A7E2FD',
  300: '#73CDFB',
  400: '#47C0FA',
  500: '#38BDF8',
  600: '#1598D9',
  700: '#0E79AD',
  800: '#105F88',
  900: '#114F70',
};

const coral: ColorScale = {
  50: '#FFF2EE',
  100: '#FFE4DB',
  200: '#FFC8B7',
  300: '#FFA78F',
  400: '#FF8E76',
  500: '#FF7F6A',
  600: '#EF5F4E',
  700: '#CC3F32',
  800: '#A7342B',
  900: '#8A2F28',
};

const neutral: ColorScale = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const type = {
  family: {
    heading: 'Sora_700Bold',
    headingSemi: 'Sora_600SemiBold',
    body: 'Manrope_500Medium',
    bodySemi: 'Manrope_600SemiBold',
    bodyBold: 'Manrope_700Bold',
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 22,
    xl: 28,
    xxl: 34,
  },
  lineHeights: {
    xs: 16,
    sm: 18,
    base: 22,
    md: 24,
    lg: 30,
    xl: 36,
    xxl: 42,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const elevation = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

export const motion = {
  quick: 180,
  normal: 220,
  slow: 260,
} as const;

const lightRole: ThemeRoleColors = {
  background: '#EAF6FD',
  surface: 'rgba(255, 255, 255, 0.95)',
  surfaceAlt: '#F4FAFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  textPrimary: neutral[900],
  textSecondary: neutral[700],
  textMuted: neutral[500],
  border: 'rgba(14, 121, 173, 0.16)',
  borderStrong: 'rgba(14, 121, 173, 0.3)',
  primary: sky[600],
  primarySoft: sky[100],
  secondary: coral[500],
  secondarySoft: coral[100],
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0284C7',
  overlay: 'rgba(15, 23, 42, 0.45)',
  tabBar: 'rgba(255, 255, 255, 0.9)',
  tabBarBorder: 'rgba(14, 121, 173, 0.2)',
};

const darkRole: ThemeRoleColors = {
  background: '#071827',
  surface: 'rgba(15, 26, 41, 0.92)',
  surfaceAlt: 'rgba(18, 36, 54, 0.95)',
  surfaceGlass: 'rgba(18, 36, 54, 0.72)',
  textPrimary: '#EAF5FF',
  textSecondary: '#B6D2E8',
  textMuted: '#87A9C3',
  border: 'rgba(115, 205, 251, 0.24)',
  borderStrong: 'rgba(115, 205, 251, 0.42)',
  primary: sky[400],
  primarySoft: 'rgba(71, 192, 250, 0.18)',
  secondary: coral[300],
  secondarySoft: 'rgba(255, 167, 143, 0.2)',
  success: '#22C55E',
  successSoft: 'rgba(34, 197, 94, 0.2)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.2)',
  info: '#38BDF8',
  overlay: 'rgba(2, 8, 23, 0.6)',
  tabBar: 'rgba(9, 20, 33, 0.9)',
  tabBarBorder: 'rgba(115, 205, 251, 0.25)',
};

export const lightTheme: AppTheme = {
  color: {
    brand: { sky, coral, neutral },
    role: lightRole,
  },
  spacing,
  radius,
  type,
  elevation,
  motion,
};

export const darkTheme: AppTheme = {
  color: {
    brand: { sky, coral, neutral },
    role: darkRole,
  },
  spacing,
  radius,
  type,
  elevation,
  motion,
};

// Legacy aliases for older screens/hooks during migration.
export const colors = {
  ink: neutral[900],
  muted: neutral[500],
  blue: sky[600],
  coral: coral[500],
  surface: '#FFFFFF',
  background: '#EAF6FD',
  border: '#BFDBEA',
} as const;

export const radii = {
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  pill: radius.pill,
} as const;

export const typography = {
  sizes: {
    xs: type.sizes.xs,
    sm: type.sizes.sm,
    base: type.sizes.base,
    md: type.sizes.md,
    lg: type.sizes.lg,
    xl: type.sizes.xl,
    xxl: type.sizes.xxl,
  },
  weights: type.weights,
} as const;
