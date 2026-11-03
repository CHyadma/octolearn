import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, HIT, radius, space, type } from '../theme';

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  label: string;
  index: number;
  state: OptionState;
  disabled: boolean;
  onPress: () => void;
}

const look: Record<OptionState, { border: string; bg: string; fg: string }> = {
  idle: { border: colors.border, bg: colors.bg, fg: colors.text },
  selected: { border: colors.blue, bg: '#DDF4FF', fg: '#1899D6' },
  correct: { border: colors.green, bg: colors.greenSoft, fg: colors.greenDark },
  wrong: { border: colors.red, bg: colors.redSoft, fg: colors.redDark },
  dimmed: { border: colors.border, bg: colors.bg, fg: colors.lockedIcon },
};

export function OptionButton({ label, index, state, disabled, onPress }: Props) {
  const l = look[state];
  return (
    <Pressable
      testID={`option-${index}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: state === 'selected', disabled }}
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
              borderBottomWidth: pressed ? 2 : 5,
              marginTop: pressed ? 3 : 0,
            },
          ]}
        >
          <View style={[styles.key, { borderColor: l.border }]}>
            <Text style={[styles.keyText, { color: l.fg }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.label, { color: l.fg }]}>{label}</Text>
          {state === 'correct' && <Ionicons name="checkmark-circle" size={24} color={colors.green} />}
          {state === 'wrong' && <Ionicons name="close-circle" size={24} color={colors.red} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HIT + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  key: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  keyText: { ...type.caption, fontWeight: '800' },
  label: { ...type.title, flex: 1 },
});
