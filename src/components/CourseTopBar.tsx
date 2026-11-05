import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';

interface Props {
  xp: number;
  streak: number;
}

/** Shared top app bar: streak chip · brand · XP chip. */
export function CourseTopBar({ xp, streak }: Props) {
  return (
    <View style={styles.bar}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: streak > 0 ? colors.tertiaryFixed : colors.surfaceContainer,
          },
        ]}
        accessibilityLabel={`${streak} өдрийн цуврал`}
      >
        <Ionicons name="flame" size={18} color={streak > 0 ? colors.tertiaryContainer : colors.outline} />
        <Text
          style={[
            styles.chipText,
            {
              color: streak > 0 ? colors.onTertiaryFixedVariant : colors.outline,
            },
          ]}
        >
          {streak} өдөр
        </Text>
      </View>
      <Text style={styles.brand} accessibilityRole="header">
        OctoLearn
      </Text>
      <View style={[styles.chip, { backgroundColor: colors.surfaceHigh }]} accessibilityLabel={`${xp} XP`}>
        <Ionicons name="diamond" size={16} color={colors.primaryContainer} />
        <Text style={[styles.chipText, { color: colors.primary }]}>{xp} XP</Text>
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.margin,
      paddingVertical: space.sm,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
      zIndex: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      minHeight: 34,
    },
    chipText: { ...type.labelMd },
    brand: { ...type.headlineMd, color: colors.primary, letterSpacing: -0.3 },
  }),
);
