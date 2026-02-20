export const colors = {
  primary: '#4B6A9B',
  primaryLight: '#EDF1F7',
  primaryDark: '#3A5578',
  success: '#5B9A7D',
  successLight: '#EBF5F0',
  warning: '#C49A4A',
  warningLight: '#FAF3E6',
  danger: '#C0675F',
  dangerLight: '#FAEAE8',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F4F7',
  textPrimary: '#1A2332',
  textSecondary: '#6B7A8D',
  textTertiary: '#9BA7B5',
  border: '#E3E8EF',
  borderFocus: '#4B6A9B',
  shadow: 'rgba(15, 23, 42, 0.06)',
  shadowMd: 'rgba(15, 23, 42, 0.08)',
  shadowLg: 'rgba(15, 23, 42, 0.12)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadowMd,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadowLg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadowLg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
