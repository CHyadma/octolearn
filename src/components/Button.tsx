import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, themed, type } from '../theme';

type Variant = 'primary' | 'success' | 'danger' | 'secondary';

const palette: Record<Variant, { bg: string; edge: string; fg: string; border?: string }> = themed(() => ({
  primary: {
    bg: colors.primaryContainer,
    edge: colors.primaryShadow,
    fg: colors.white,
  },
  success: { bg: colors.secondary, edge: colors.successEdge, fg: colors.white },
  danger: { bg: colors.error, edge: colors.onErrorContainer, fg: colors.white },
  secondary: {
    bg: colors.surfaceLowest,
    edge: colors.surfaceHigh,
    fg: colors.primary,
    border: colors.secondaryBorder,
  },
}));

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Icon before the label (default: after). */
  iconLeading?: boolean;
}

/** Tactile 3D button (design: `tactile-btn-primary` — 4px solid shadow, presses down 2px). */
export function Button({ label, onPress, variant = 'primary', disabled, style, testID, icon, iconLeading }: Props) {
  const p = disabled
    ? {
        bg: colors.surfaceHigh,
        edge: colors.outlineVariant,
        fg: colors.outline,
        border: undefined,
      }
    : palette[variant];
  const iconEl = icon ? <Ionicons name={icon} size={20} color={p.fg} /> : null;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={style}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            {
              backgroundColor: p.bg,
              borderColor: p.border ?? p.bg,
              borderWidth: p.border ? 2 : 0,
              shadowColor: p.edge,
              borderBottomColor: p.edge,
              borderBottomWidth: pressed ? 2 : 4,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          {iconLeading && iconEl}
          <Text style={[styles.label, { color: p.fg }]}>{label}</Text>
          {!iconLeading && iconEl}
        </View>
      )}
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    base: {
      height: 56,
      borderRadius: radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
    },
    label: { ...type.labelLg },
  }),
);
