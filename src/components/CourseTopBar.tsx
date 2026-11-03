import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, space, type } from '../theme';
import { ProgressBar } from './ProgressBar';

interface Props {
  completed: number;
  total: number;
  percent: number;
  xp: number;
  streak: number;
}

/** Always-visible course progress, streak and XP on the home screen. */
export function CourseTopBar({ completed, total, percent, xp, streak }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.progress}>
          <Text style={styles.label} numberOfLines={1}>
            {completed} / {total} хичээл · {percent}%
          </Text>
          <ProgressBar value={total ? completed / total : 0} height={14} />
        </View>
        <View style={styles.stat} accessibilityLabel={`${streak} өдрийн streak`}>
          <Ionicons name="flame" size={22} color={streak > 0 ? colors.orange : colors.lockedIcon} />
          <Text style={[styles.statText, { color: streak > 0 ? colors.orange : colors.lockedIcon }]}>{streak}</Text>
        </View>
        <View style={styles.stat} accessibilityLabel={`${xp} XP`}>
          <Ionicons name="flash" size={22} color={colors.gold} />
          <Text style={[styles.statText, { color: colors.goldDark }]}>{xp}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progress: { flex: 1, gap: 6 },
  label: { ...type.caption },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  statText: { ...type.title, fontWeight: '800' },
});
