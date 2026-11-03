import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';

interface Day {
  key: string;
  label: string;
  xp: number;
  isToday: boolean;
}

/** Tiny 7-day XP bar chart (plain Views — no chart dependency). */
export function WeeklyChart({ days }: { days: Day[] }) {
  const max = Math.max(10, ...days.map((d) => d.xp));
  const total = days.reduce((s, d) => s + d.xp, 0);
  return (
    <View style={styles.card} accessibilityLabel={`Сүүлийн 7 хоногт ${total} XP`}>
      <View style={styles.head}>
        <Text style={styles.title}>Долоо хоногийн идэвх</Text>
        <Text style={styles.total}>{total} XP</Text>
      </View>
      <View style={styles.bars}>
        {days.map((d) => (
          <View key={d.key} style={styles.col}>
            <Text style={styles.value}>{d.xp > 0 ? d.xp : ''}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(d.xp > 0 ? 8 : 0, (d.xp / max) * 100)}%`, backgroundColor: d.isToday ? colors.brand : colors.blue },
                ]}
              />
            </View>
            <Text style={[styles.day, d.isToday && { color: colors.brand }]}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...type.title },
  total: { ...type.caption, color: colors.goldDark },
  bars: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  value: { ...type.caption, fontSize: 11, minHeight: 14 },
  track: { height: 90, width: '70%', maxWidth: 28, backgroundColor: colors.surface, borderRadius: radius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: radius.sm },
  day: { ...type.caption },
});
