/**
 * Design tokens for the BirGe app.
 * Single source of truth for colors, spacing, typography, radii and shadows.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Brand — single coral voltage (Airbnb "Rausch"). Used scarcely: primary CTA,
  // active tab, save state, brand mark. ~90% of every screen is white + ink.
  primary: '#FF385C',
  primaryDark: '#E00B41', // press / pointer-down
  primarySoft: '#FFE8EC', // pale tint fill (soft buttons, selected chips, badges)

  // Backgrounds / surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7', // soft fill — fields, filter bands, hover
  surfaceStrong: '#F2F2F2', // steppers, segmented track, icon-button fill

  // Text — never pure black
  text: '#222222', // ink — headlines, body, prices, star rating
  textSecondary: '#6A6A6A', // muted — subtitles, meta, inactive tabs
  textMuted: '#929292', // muted-soft — disabled / faint
  textInverse: '#FFFFFF',

  // Lines / borders
  border: '#DDDDDD', // hairline
  borderStrong: '#C1C1C1',

  // Savings axis — SCOPED green. Only quantifies a saving: discount %, team
  // price, "you save X", progress fill. Never a CTA, never decorative.
  success: '#1FA463', // savings
  successSoft: '#E6F6EE', // savings-soft (pill / banner background)
  savingsDeep: '#137A48', // legible text on savings-soft

  // States
  warning: '#B86700', // demo / jury / "simulated" affordances
  warningSoft: '#FBF1DD',
  danger: '#C13515', // form errors + destructive — distinct from coral
  dangerSoft: '#FDECE4',
  info: '#222222', // info uses ink, not blue (Airbnb discipline)
  infoSoft: '#F2F2F2',

  // Misc
  star: '#222222', // ratings render in ink, not gold — deliberate
  overlay: 'rgba(0,0,0,0.5)', // modal / sheet scrim
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
  sm: 8, // buttons, inputs, small banners
  md: 14, // cards, product photos — the marketplace default
  lg: 20, // large cards, sheet headers
  xl: 28, // bottom-sheet top corners
  pill: 999,
} as const;

// Inter (the open substitute for Airbnb Cereal — full Cyrillic coverage). Each
// weight is its own loaded family, so the glyph weight is exact on web + native;
// fontWeight is kept only as a fallback for any text that misses a family.
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

// Modest weights (Airbnb leans on photography, not typographic muscle). The one
// loud moment is `savingsHero` — the group-buy price-drop number.
export const typography = {
  savingsHero: { fontFamily: fonts.bold, fontSize: 40, fontWeight: '700', letterSpacing: -0.5 } as TextStyle,
  display: { fontFamily: fonts.bold, fontSize: 28, fontWeight: '700', letterSpacing: -0.3 } as TextStyle,
  h1: { fontFamily: fonts.semibold, fontSize: 24, fontWeight: '600', letterSpacing: -0.3 } as TextStyle,
  h2: { fontFamily: fonts.semibold, fontSize: 20, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,
  h3: { fontFamily: fonts.semibold, fontSize: 17, fontWeight: '600' } as TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 15, fontWeight: '400' } as TextStyle,
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, fontWeight: '600' } as TextStyle,
  caption: { fontFamily: fonts.regular, fontSize: 13, fontWeight: '400' } as TextStyle,
  captionStrong: { fontFamily: fonts.semibold, fontSize: 13, fontWeight: '600' } as TextStyle,
  small: { fontFamily: fonts.semibold, fontSize: 11, fontWeight: '600' } as TextStyle,
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
