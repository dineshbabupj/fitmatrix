/**
 * FitMetrics — Material 3 Design System Theme Definition for Expo / React Native
 */

export const colors = {
  light: {
    primary: '#2E7D32',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E8F5E9',
    onPrimaryContainer: '#1B5E20',
    secondary: '#1976D2',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E3F2FD',
    onSecondaryContainer: '#0D47A1',
    background: '#F8F9FA',
    onBackground: '#1C1B1F',
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#F1F5F1',
    onSurfaceVariant: '#444746',
    error: '#D32F2F',
    onError: '#FFFFFF',
    outline: '#79747E',
  },
  dark: {
    primary: '#81C784',
    onPrimary: '#00390A',
    primaryContainer: '#1B5E20',
    onPrimaryContainer: '#C8E6C9',
    secondary: '#64B5F6',
    onSecondary: '#00325B',
    secondaryContainer: '#0D47A1',
    onSecondaryContainer: '#E3F2FD',
    background: '#121212',
    onBackground: '#E6E1E5',
    surface: '#1E1E1E',
    onSurface: '#E6E1E5',
    surfaceVariant: '#2A2C28',
    onSurfaceVariant: '#C4C7C5',
    error: '#EF5350',
    onError: '#600004',
    outline: '#938F96',
  },
};

export const typography = {
  headline: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const shapes = {
  small: 4,
  medium: 8,
  large: 16,
  full: 9999,
};

export const theme = {
  colors,
  typography,
  spacing,
  shapes,
};

export default theme;
