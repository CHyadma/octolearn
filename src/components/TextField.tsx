import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, HIT, radius, space, themed, type } from '../theme';

interface Props extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Adds a show/hide toggle. */
  secret?: boolean;
}

export const TextField = forwardRef<TextInputInstance, Props>(function TextField({ label, icon, secret, style, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, focused && styles.focused]}>
        <Ionicons name={icon} size={20} color={focused ? colors.brand : colors.lockedIcon} />
        <TextInput
          {...rest}
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.lockedIcon}
          secureTextEntry={secret && hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          accessibilityLabel={label}
        />
        {secret && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Нууц үг харуулах' : 'Нууц үг нуух'}
          >
            <Ionicons name={hidden ? 'eye' : 'eye-off'} size={20} color={colors.lockedIcon} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    wrap: { gap: 6 },
    label: { ...type.labelMd, color: colors.onSurfaceVariant },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      minHeight: HIT + 4,
      borderWidth: 2,
      borderColor: colors.outlineVariant,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceLowest,
      paddingHorizontal: space.md,
    },
    focused: {
      borderColor: colors.primaryContainer,
      backgroundColor: colors.surfaceLow,
    },
    input: {
      ...type.bodyLg,
      color: colors.onSurface,
      flex: 1,
      paddingVertical: space.md,
      outlineStyle: 'none',
    } as object,
  }),
);
