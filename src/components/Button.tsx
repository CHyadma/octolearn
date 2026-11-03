import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, HIT, radius, type } from '../theme';

type Variant = 'primary' | 'success' | 'danger' | 'secondary';

const palette: Record<Variant, { bg: string; edge: string; fg: string }> = {
  primary: { bg: colors.brand, edge: colors.brandDark, fg: colors.white },
  success: { bg: colors.green, edge: colors.greenDark, fg: colors.white },
  danger: { bg: colors.red, edge: colors.redDark, fg: colors.white },
  secondary: { bg: colors.white, edge: colors.border, fg: colors.brand },
};

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/** Chunky "3D" button used for every primary action in the app. */
export function Button({ label, onPress, variant = 'primary', disabled, style, testID }: Props) {
  const p = disabled
    ? { bg: colors.locked, edge: colors.lockedDark, fg: colors.lockedIcon }
    : palette[variant];
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
              borderColor: variant === 'secondary' && !disabled ? colors.border : p.bg,
              borderBottomColor: p.edge,
              borderBottomWidth: pressed ? 2 : 5,
              marginTop: pressed ? 3 : 0,
            },
          ]}
        >
          <Text style={[styles.label, { color: p.fg }]}>{label.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HIT + 4,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: { ...type.title, letterSpacing: 0.8 },
});
