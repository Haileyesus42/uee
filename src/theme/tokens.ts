// Design tokens for the UEE learning app.
// Palette matches the "Unity" home reference exactly (light + dark). Colors
// carry meaning: brand = primary actions/identity, highlight = the accent
// used for standout copy (purple in light mode, amber in dark — matches the
// reference's own per-theme divergence), success/warning/secondary = the
// three feature-card accents (Mock Exams/Quiz Modes/UEE Exams).

export const color = {
  light: {
    bg: '#FBF4E9',
    surface: '#FFFDF8',
    surfaceAlt: '#FFFFFF',
    border: 'rgba(38, 28, 71, 0.09)',
    textPrimary: '#241F36',
    textSecondary: '#77718A',
    textInverse: '#FFFFFF',

    brand: '#6D4DED',
    brandDark: '#5936C9',
    brandLight: '#F3EDFC',

    secondary: '#2F6BB0',
    secondaryLight: '#E9F1FB',

    success: '#2F7D4F',
    successLight: '#EDF7EE',
    error: '#E4573D',
    errorLight: '#FCE7E2',
    warning: '#7A5A12',
    warningLight: '#FDF3E0',

    highlight: '#6D4DED',
    xp: '#7A5A12',
    streak: '#6D4DED',
    locked: '#C9C2D6',
    mastery: '#6D4DED',

    chip: '#FFFFFF',
    chipBorder: 'rgba(38, 28, 71, 0.08)',
    track: '#ECE4D6',

    overlay: 'rgba(35, 28, 59, 0.5)',
  },
  dark: {
    bg: '#0B0815',
    surface: '#161122',
    surfaceAlt: '#1D1730',
    border: 'rgba(255, 255, 255, 0.07)',
    textPrimary: '#F4F1FF',
    textSecondary: '#A49EC2',
    textInverse: '#FFFFFF',

    brand: '#7C5CFF',
    brandDark: '#6A3FF0',
    brandLight: '#221A3A',

    secondary: '#7C8CFF',
    secondaryLight: '#232748',

    success: '#4FCB82',
    successLight: '#1C3226',
    error: '#F17A63',
    errorLight: '#3A2119',
    warning: '#F5BC5C',
    warningLight: '#3A2E14',

    highlight: '#F5B04E',
    xp: '#F5B04E',
    streak: '#F5B04E',
    locked: '#4A4258',
    mastery: '#7C5CFF',

    chip: '#221A3A',
    chipBorder: 'rgba(167, 139, 250, 0.25)',
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
