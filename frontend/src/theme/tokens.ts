// Design tokens for the Tizata UEE learning app.
// Palette: Dark Green (#0B5E4B) / Gold (#F4B740) / Cream (#FAF9F6) / Deep Navy
// (#0E2A2B) — the four brand colors. brand = primary actions/identity (green,
// both modes), highlight/xp/streak = the gold accent used for standout copy
// (both modes — gold reads as "the accent against green" in the brand
// reference regardless of theme, unlike the old purple palette's per-theme
// divergence). success/error/warning/secondary stay their own distinguishable
// hues on purpose — collapsing "correct answer" into the same green as brand
// chrome would blur a signal that needs to read as its own event, not just
// "on-brand."
export const color = {
  light: {
    bg: '#FAF9F6',
    surface: '#FFFFFF',
    surfaceAlt: '#F4F2ED',
    border: 'rgba(14, 42, 43, 0.10)',
    textPrimary: '#16231F',
    textSecondary: '#5C6B64',
    textInverse: '#FFFFFF',

    brand: '#0B5E4B',
    brandDark: '#094B3C',
    brandLight: '#E0F0EA',

    secondary: '#0E2A2B',
    secondaryLight: '#E7ECEC',

    success: '#2E8B57',
    successLight: '#E7F5ED',
    error: '#C0392B',
    errorLight: '#FBEAE7',
    warning: '#8A5A00',
    warningLight: '#FDF1DC',

    highlight: '#C98A1A',
    xp: '#C98A1A',
    streak: '#C98A1A',
    locked: '#CDD3CE',
    mastery: '#0B5E4B',

    chip: '#FFFFFF',
    chipBorder: 'rgba(14, 42, 43, 0.08)',
    track: '#ECE8DD',

    overlay: 'rgba(14, 35, 31, 0.5)',
  },
  dark: {
    bg: '#0E2A2B',
    surface: '#15393A',
    surfaceAlt: '#1C4345',
    border: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#F4F1EA',
    textSecondary: '#A9B8B3',
    textInverse: '#FFFFFF',

    brand: '#1FAE87',
    brandDark: '#0B5E4B',
    brandLight: '#16342E',

    secondary: '#4A7A7C',
    secondaryLight: '#1C3334',

    success: '#3FB87F',
    successLight: '#16332A',
    error: '#E86F5C',
    errorLight: '#3A2119',
    warning: '#F4B740',
    warningLight: '#3A2E14',

    highlight: '#F4B740',
    xp: '#F4B740',
    streak: '#F4B740',
    locked: '#3A4644',
    mastery: '#1FAE87',

    chip: '#1C4345',
    chipBorder: 'rgba(244, 183, 64, 0.25)',
    track: 'rgba(255, 255, 255, 0.09)',

    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ColorScheme = keyof typeof color;
export type Colors = Record<keyof typeof color.light, string>;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 12,
  pill: 999,
} as const;

// Manrope = headings/emphasis, Inter = body/UI text — matches the reference.
export const fontFamily = {
  headingBold: 'Manrope_800ExtraBold',
  headingSemibold: 'Manrope_700Bold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamily.headingBold, fontSize: 32, fontWeight: '800' as const, lineHeight: 38 },
  h1: { fontFamily: fontFamily.headingBold, fontSize: 26, fontWeight: '800' as const, lineHeight: 32 },
  h2: { fontFamily: fontFamily.headingBold, fontSize: 21, fontWeight: '800' as const, lineHeight: 27 },
  h3: { fontFamily: fontFamily.headingBold, fontSize: 17, fontWeight: '800' as const, lineHeight: 22 },
  body: { fontFamily: fontFamily.bodyRegular, fontSize: 15, fontWeight: '400' as const, lineHeight: 21 },
  bodyStrong: { fontFamily: fontFamily.headingSemibold, fontSize: 15, fontWeight: '700' as const, lineHeight: 21 },
  caption: { fontFamily: fontFamily.bodyMedium, fontSize: 13, fontWeight: '500' as const, lineHeight: 17 },
  button: { fontFamily: fontFamily.bodyBold, fontSize: 16, fontWeight: '700' as const, lineHeight: 20 },
  question: { fontFamily: fontFamily.bodySemibold, fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  numeric: {
    fontFamily: fontFamily.headingBold,
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 28,
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;
