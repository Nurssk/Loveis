/**
 * Design tokens for the BirGe app.
 * Single source of truth for colors, spacing, typography, radii and shadows.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Brand
  primary: '#FF5A1F', // strong warm accent
  primaryDark: '#E64715',
  primarySoft: '#FFF1EB',

  // Backgrounds
  background: '#FBFAF8', // warm neutral
  surface: '#FFFFFF',
  surfaceAlt: '#F4F2EE',

  // Text
  text: '#1A1A1E',
  textSecondary: '#6B6B72',
  textMuted: '#9A9AA2',
  textInverse: '#FFFFFF',

  // Lines / borders
  border: '#ECE9E3',
  borderStrong: '#DCD8D0',

  // States
  success: '#1FA463',
  successSoft: '#E6F6EE',
  warning: '#E6A700',
  danger: '#E5484D',
  dangerSoft: '#FCEBEC',
  info: '#2F6FED',
  infoSoft: '#EAF1FE',

  // Misc
  star: '#F5A623',
  overlay: 'rgba(20,20,24,0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 } as TextStyle,
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 } as TextStyle,
  h3: { fontSize: 17, fontWeight: '700' } as TextStyle,
  body: { fontSize: 15, fontWeight: '500' } as TextStyle,
  bodyStrong: { fontSize: 15, fontWeight: '700' } as TextStyle,
  caption: { fontSize: 13, fontWeight: '500' } as TextStyle,
  small: { fontSize: 11, fontWeight: '600' } as TextStyle,
} as const;

export const shadows: Record<'card' | 'floating', ViewStyle> = {
  card: Platform.select({
    web: { boxShadow: '0 4px 16px rgba(20,20,24,0.06)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1A1A1E',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  }) as ViewStyle,
  floating: Platform.select({
    web: { boxShadow: '0 8px 28px rgba(20,20,24,0.12)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#1A1A1E',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  }) as ViewStyle,
};

/** Max content width so the app looks like a phone on wide web screens. */
export const LAYOUT = {
  maxContentWidth: 480,
} as const;
