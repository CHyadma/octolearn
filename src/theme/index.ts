import { Platform } from 'react-native';

export const colors = {
  brand: '#7C4DFF',
  brandDark: '#5B32D6',
  brandSoft: '#EFE9FF',
  green: '#58CC02',
  greenDark: '#46A302',
  greenSoft: '#D7FFB8',
  red: '#FF4B4B',
  redDark: '#D93A3A',
  redSoft: '#FFDFE0',
  gold: '#FFC800',
  goldDark: '#E0A800',
  orange: '#FF9600',
  blue: '#1CB0F6',
  text: '#3C3C3C',
  textMuted: '#777777',
  border: '#E5E5E5',
  locked: '#E5E5E5',
  lockedDark: '#C4C4C4',
  lockedIcon: '#AFAFAF',
  bg: '#FFFFFF',
  surface: '#F7F7F7',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

/** Minimum touch target (Apple HIG 44pt / Material 48dp). */
export const HIT = 48;

const family = Platform.select({ ios: 'System', android: 'sans-serif', default: undefined });

export const type = {
  h1: { fontFamily: family, fontSize: 26, fontWeight: '800', color: colors.text },
  h2: { fontFamily: family, fontSize: 20, fontWeight: '800', color: colors.text },
  title: { fontFamily: family, fontSize: 17, fontWeight: '700', color: colors.text },
  body: { fontFamily: family, fontSize: 16, fontWeight: '500', color: colors.text },
  caption: { fontFamily: family, fontSize: 13, fontWeight: '700', color: colors.textMuted },
} as const;
