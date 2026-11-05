import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  label: string;
  index: number;
  state: OptionState;
  disabled: boolean;
  onPress: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const look: Record<
  OptionState,
  {
    border: string;
    bg: string;
    edge: string;
    fg: string;
    keyBg: string;
    keyFg: string;
  }
> = themed(() => ({
  idle: {
    border: colors.optionBorder,
    bg: colors.surfaceLowest,
    edge: colors.optionEdge,
    fg: colors.onSurface,
    keyBg: colors.surfaceContainer,
    keyFg: colors.onSurfaceVariant,
  },
  selected: {
    border: colors.primaryContainer,
    bg: colors.surfaceLow,
    edge: colors.primaryContainer,
    fg: colors.primary,
    keyBg: colors.primaryContainer,
    keyFg: colors.white,
  },
  correct: {
    border: colors.secondary,
    bg: colors.successSoft,
    edge: colors.secondary,
    fg: colors.secondary,
    keyBg: colors.secondary,
    keyFg: colors.white,
  },
  wrong: {
    border: colors.error,
    bg: colors.errorContainer,
    edge: colors.error,
    fg: colors.onErrorContainer,
    keyBg: colors.error,
    keyFg: colors.white,
  },
  dimmed: {
    border: colors.optionDimBorder,
    bg: colors.surfaceLowest,
    edge: colors.optionDimEdge,
    fg: colors.outline,
    keyBg: colors.surfaceLow,
    keyFg: colors.outline,
  },
}));

/** Answer card (design: "Option Cards Set" — letter badge, label, check marker). */
export function OptionButton({ label, index, state, disabled, onPress }: Props) {
  const l = look[state];
  const marked = state === 'selected' || state === 'correct' || state === 'wrong';
  return (
    <Pressable
      testID={`option-${index}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: state === 'selected', disabled }}
      accessibilityLabel={`${LETTERS[index]}. ${label}`}
      disabled={disabled}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.base,
            {
              borderColor: l.border,
              backgroundColor: l.bg,
              borderBottomColor: l.edge,
              borderBottomWidth: pressed ? 2 : 5,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          <View style={[styles.key, { backgroundColor: l.keyBg }]}>
            <Text style={[styles.keyText, { color: l.keyFg }]}>{LETTERS[index]}</Text>
          </View>
          <Text style={[styles.label, { color: l.fg }, marked && styles.labelStrong]}>{label}</Text>
          {marked ? (
            <View style={[styles.marker, { backgroundColor: l.keyBg }]}>
              <Ionicons name={state === 'wrong' ? 'close' : 'checkmark'} size={18} color={colors.white} />
            </View>
          ) : (
            <View style={[styles.marker, styles.markerEmpty]} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    base: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      borderWidth: 2,
      borderRadius: radius.lg,
      padding: space.md,
    },
    key: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: { ...type.labelMd },
    label: { ...type.bodyLg, flex: 1 },
    labelStrong: { fontFamily: type.headlineMd.fontFamily },
    marker: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerEmpty: { borderWidth: 2, borderColor: colors.optionMarker },
  }),
);
