/**
 * Design tokens from the Stitch design ("Сургалтын замнал" set): indigo primary,
 * mint progress, amber milestones, soft lavender surfaces.
 *
 * Font: the design specifies Plus Jakarta Sans, but that family has no basic
 * Cyrillic glyphs (А–я), so Mongolian text would fall back to a system font
 * mid-word. Manrope is the closest geometric sans with full Cyrillic + Ө/Ү.
 */
export const lightPalette = {
  primary: '#412cdd',
  primaryContainer: '#5b4cf5',
  primaryShadow: '#3619d4',
  onPrimaryContainer: '#eae6ff',
  primaryFixed: '#e3dfff',
  primaryFixedDim: '#c4c0ff',
  secondary: '#006c49',
  secondaryContainer: '#6cf8bb',
  secondaryFixedDim: '#4edea3',
  tertiary: '#734700',
  tertiaryContainer: '#935d00',
  tertiaryFixed: '#ffddb8',
  tertiaryFixedDim: '#ffb95f',
  onTertiaryFixedVariant: '#653e00',
  amberShadow: '#d97706',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  background: '#faf8ff',
  surface: '#faf8ff',
  surfaceLowest: '#ffffff',
  surfaceLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceHigh: '#e2e7ff',
  surfaceHighest: '#dae2fd',
  onSurface: '#131b2e',
  onSurfaceVariant: '#464556',
  outline: '#777587',
  outlineVariant: '#c8c4d8',
  // component-level tokens that were hard-coded hex values
  successSoft: '#e6fbf1',
  successEdge: '#00513a',
  cardBorder: 'rgba(226,231,255,0.6)',
  secondaryBorder: '#d3cefa',
  optionBorder: 'rgba(200,196,216,0.4)',
  optionEdge: '#e2e8f0',
  optionDimBorder: 'rgba(200,196,216,0.3)',
  optionDimEdge: '#eef0f6',
  optionMarker: 'rgba(200,196,216,0.5)',
  overlay: 'rgba(19,27,46,0.5)',
  /** Dark pill behind white text (tooltips, toasts). */
  inverseSurface: '#131b2e',
};

export type Palette = typeof lightPalette;

/**
 * Dark scheme: same hues, tuned for a deep indigo background. "primary",
 * "secondary" and "tertiary" are used for text/icons on surfaces, so they get
 * lighter; the *Container tones carry white text and stay saturated.
 */
export const darkPalette: Palette = {
  primary: '#c4c0ff',
  primaryContainer: '#5b4cf5',
  primaryShadow: '#3619d4',
  onPrimaryContainer: '#eae6ff',
  primaryFixed: '#2e2777',
  primaryFixedDim: '#4b40b8',
  secondary: '#1f9e6e',
  secondaryContainer: '#0d5c40',
  secondaryFixedDim: '#4edea3',
  tertiary: '#ffb95f',
  tertiaryContainer: '#f0a040',
  tertiaryFixed: '#4a3000',
  tertiaryFixedDim: '#ffb95f',
  onTertiaryFixedVariant: '#ffddb8',
  amberShadow: '#b45f06',
  error: '#e5484d',
  errorContainer: '#4d1517',
  onErrorContainer: '#ffdad6',
  background: '#0f1120',
  surface: '#0f1120',
  surfaceLowest: '#181b2e',
  surfaceLow: '#1d2136',
  surfaceContainer: '#23283f',
  surfaceHigh: '#2b3149',
  surfaceHighest: '#353c58',
  onSurface: '#e4e6f5',
  onSurfaceVariant: '#b9b7cc',
  outline: '#8e8ca3',
  outlineVariant: '#3e4260',
  successSoft: '#0f2e24',
  successEdge: '#0a5a3c',
  cardBorder: 'rgba(62,66,96,0.6)',
  secondaryBorder: '#3e4260',
  optionBorder: 'rgba(62,66,96,0.9)',
  optionEdge: '#2b3149',
  optionDimBorder: 'rgba(62,66,96,0.5)',
  optionDimEdge: '#1d2136',
  optionMarker: 'rgba(142,140,163,0.5)',
  overlay: 'rgba(0,0,0,0.6)',
  inverseSurface: '#3a4166',
};

function buildColors(p: Palette) {
  return {
    ...p,
    brand: p.primaryContainer,
    brandDark: p.primaryShadow,
    brandSoft: p.surfaceContainer,
    green: p.secondary,
    greenDark: p.secondary,
    greenSoft: p.successSoft,
    red: p.error,
    redDark: p.onErrorContainer,
    redSoft: p.errorContainer,
    gold: p.tertiaryFixedDim,
    goldDark: p.amberShadow,
    orange: p.tertiaryContainer,
    blue: p.primaryContainer,
    text: p.onSurface,
    textMuted: p.onSurfaceVariant,
    border: p.surfaceHigh,
    locked: p.surfaceHigh,
    lockedDark: p.outlineVariant,
    lockedIcon: p.outline,
    bg: p.background,
    white: '#FFFFFF',
  };
}

export type ColorScheme = 'light' | 'dark';

/**
 * Active colors. This object is mutated in place by `applyScheme`, so code that
 * reads `colors.x` at render time always sees the current scheme. Module-level
 * style objects must be wrapped in `themed()` so they are rebuilt too.
 */
export const colors = buildColors(lightPalette);

let currentScheme: ColorScheme = 'light';
let themeVersion = 0;

export function applyScheme(scheme: ColorScheme) {
  if (scheme === currentScheme) return false;
  currentScheme = scheme;
  Object.assign(colors, buildColors(scheme === 'dark' ? darkPalette : lightPalette));
  themeVersion += 1;
  return true;
}

export const getScheme = () => currentScheme;

/**
 * Lazily built, scheme-aware object (StyleSheet, variant maps…). The factory
 * re-runs the first time the object is read after the scheme changes.
 */
export function themed<T extends object>(make: () => T): T {
  let cache: T | null = null;
  let builtFor = -1;
  const current = (): T => {
    if (!cache || builtFor !== themeVersion) {
      cache = make();
      builtFor = themeVersion;
    }
    return cache;
  };
  return new Proxy({} as T, {
    get: (_t, key) => Reflect.get(current(), key),
    has: (_t, key) => Reflect.has(current(), key),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_t, key) => {
      const d = Reflect.getOwnPropertyDescriptor(current(), key);
      return d ? { ...d, configurable: true } : undefined;
    },
  });
}

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  margin: 20,
} as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

/** Minimum touch target (Apple HIG 44pt / Material 48dp). */
export const HIT = 48;

export const fontFamily = {
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

/** Type scale from the design system (sizes / line heights / weights). */
export const type = themed(
  () =>
    ({
      headlineXl: {
        fontFamily: fontFamily.extrabold,
        fontSize: 26,
        lineHeight: 34,
        color: colors.text,
      },
      headlineLg: {
        fontFamily: fontFamily.extrabold,
        fontSize: 24,
        lineHeight: 32,
        color: colors.text,
      },
      headlineMd: {
        fontFamily: fontFamily.bold,
        fontSize: 20,
        lineHeight: 28,
        color: colors.text,
      },
      bodyLg: {
        fontFamily: fontFamily.semibold,
        fontSize: 18,
        lineHeight: 26,
        color: colors.text,
      },
      bodyMd: {
        fontFamily: fontFamily.medium,
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
      },
      bodySm: {
        fontFamily: fontFamily.medium,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textMuted,
      },
      labelLg: {
        fontFamily: fontFamily.bold,
        fontSize: 16,
        lineHeight: 20,
        color: colors.text,
      },
      labelMd: {
        fontFamily: fontFamily.bold,
        fontSize: 14,
        lineHeight: 18,
        color: colors.text,
      },
      labelSm: {
        fontFamily: fontFamily.extrabold,
        fontSize: 11,
        lineHeight: 14,
        letterSpacing: 0.55,
        color: colors.textMuted,
      },
      // Legacy names used by older components
      h1: {
        fontFamily: fontFamily.extrabold,
        fontSize: 26,
        lineHeight: 34,
        color: colors.text,
      },
      h2: {
        fontFamily: fontFamily.bold,
        fontSize: 20,
        lineHeight: 28,
        color: colors.text,
      },
      title: {
        fontFamily: fontFamily.bold,
        fontSize: 16,
        lineHeight: 20,
        color: colors.text,
      },
      body: {
        fontFamily: fontFamily.medium,
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
      },
      caption: {
        fontFamily: fontFamily.extrabold,
        fontSize: 12,
        lineHeight: 16,
        color: colors.textMuted,
      },
    }) as const,
);

/** Soft indigo card shadow (design: `custom-card-shadow`). */
export const cardShadow = {
  shadowColor: '#5b4cf5',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;
