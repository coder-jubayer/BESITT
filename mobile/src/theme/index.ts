export const colors = {
  primary: '#4F46E5', // indigo-600
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF', // indigo-50
  primaryMuted: '#C7D2FE',
  secondary: '#10B981', // emerald
  background: '#F8FAFC', // slate-50
  surface: '#FFFFFF',
  text: '#0F172A', // slate-900
  textSecondary: '#64748B', // slate-500
  textMuted: '#94A3B8', // slate-400
  border: '#F1F5F9', // slate-100
  error: '#E11D48', // rose-600
  errorLight: '#FFF1F2',
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  rose: '#F43F5E',
  roseLight: '#FFF1F2',
  emerald: '#10B981',
  emeraldLight: '#ECFDF5',
  sky: '#0EA5E9',
  white: '#FFFFFF',
  black: '#000000',
  slate800: '#1E293B',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  caption: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fab: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;
