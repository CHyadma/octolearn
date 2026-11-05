import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { cardShadow, colors, radius, space, themed, type } from '../theme';

interface Day {
  key: string;
  label: string;
  xp: number;
  isToday: boolean;
}

/** 7-day XP bar chart (design: "Weekly Activity Chart Card"; plain Views, no chart lib). */
export function WeeklyChart({ days }: { days: Day[] }) {
  const max = Math.max(10, ...days.map((d) => d.xp));
  const total = days.reduce((s, d) => s + d.xp, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;
  return (
    <View style={styles.card} accessibilityLabel={`Сүүлийн 7 хоногт ${total} XP`}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Энэ долоо хоног</Text>
          <Text style={styles.sub}>{activeDays} өдөр хичээллэсэн</Text>
        </View>
        <View style={styles.total}>
          <Ionicons name="flash" size={14} color={colors.primary} />
          <Text style={styles.totalText}>+{total} XP</Text>
        </View>
      </View>
      <View style={styles.bars}>
        {days.map((d) => {
          const pct = d.xp > 0 ? Math.max(10, (d.xp / max) * 100) : 6;
          return (
            <View key={d.key} style={styles.col}>
              <View style={styles.barArea}>
                {d.isToday && (
                  <View style={styles.todayTag}>
                    <Text style={styles.todayText}>Өнөөдөр</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${pct}%`,
                      backgroundColor: d.isToday ? colors.primaryContainer : d.xp > 0 ? colors.primaryFixedDim : colors.surfaceHighest,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.day, d.isToday && styles.dayToday]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: {
      ...cardShadow,
      backgroundColor: colors.surfaceLowest,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: space.lg,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: space.md,
      gap: space.sm,
    },
    title: { ...type.headlineMd },
    sub: { ...type.bodySm },
    total: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceContainer,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    totalText: { ...type.labelMd, color: colors.primary },
    bars: {
      flexDirection: 'row',
      gap: space.sm,
      paddingTop: space.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceHigh,
      paddingBottom: space.sm,
    },
    col: { flex: 1, alignItems: 'center', gap: 6 },
    barArea: {
      height: 120,
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    bar: { width: '100%', borderRadius: radius.sm },
    todayTag: {
      marginBottom: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      zIndex: 2,
    },
    todayText: {
      fontFamily: type.labelSm.fontFamily,
      fontSize: 9,
      color: colors.white,
    },
    day: { ...type.labelSm },
    dayToday: { color: colors.primary },
  }),
);
