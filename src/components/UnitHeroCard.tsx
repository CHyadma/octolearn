import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';
import { ProgressBar } from './ProgressBar';

interface Props {
  unitNumber: number;
  title: string;
  /** Course-wide progress */
  completed: number;
  total: number;
  percent: number;
  locked?: boolean;
  comingSoon?: boolean;
}

/** Indigo chapter card with decorative circles (design: "Hero Module Card"). */
export function UnitHeroCard({ unitNumber, title, completed, total, percent, locked, comingSoon }: Props) {
  const bg = locked ? colors.surfaceHigh : colors.primaryContainer;
  const fg = locked ? colors.onSurfaceVariant : colors.white;
  return (
    <View style={[styles.card, { backgroundColor: bg }]} accessibilityRole="header">
      {!locked && (
        <>
          <View pointerEvents="none" style={styles.circleBig} />
          <View pointerEvents="none" style={styles.circleSmall} />
        </>
      )}
      <View style={styles.row}>
        <Text style={[styles.kicker, { color: locked ? colors.outline : colors.onPrimaryContainer }]}>БҮЛЭГ {unitNumber}</Text>
        {locked ? (
          <View style={[styles.pill, { backgroundColor: colors.surfaceLowest }]}>
            <Ionicons name={comingSoon ? 'time' : 'lock-closed'} size={12} color={colors.outline} />
            <Text style={[styles.pillText, { color: colors.outline }]}>{comingSoon ? 'Тун удахгүй' : 'Түгжээтэй'}</Text>
          </View>
        ) : (
          <View style={[styles.pill, { backgroundColor: 'rgba(65,44,221,0.45)' }]}>
            <Text style={[styles.pillText, { color: colors.white }]}>{percent}%</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, { color: fg }]}>{title}</Text>
      {!locked && (
        <>
          <Text style={styles.meta}>
            Курсийн ахиц · {completed} / {total} хичээл
          </Text>
          <ProgressBar value={total ? completed / total : 0} height={10} color={colors.secondaryContainer} track="rgba(65,44,221,0.45)" />
        </>
      )}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: {
      borderRadius: radius.md,
      padding: space.md,
      gap: 8,
      overflow: 'hidden',
      marginHorizontal: space.margin,
      marginTop: space.md,
      marginBottom: space.lg,
    },
    circleBig: {
      position: 'absolute',
      right: -24,
      bottom: -24,
      width: 128,
      height: 128,
      borderRadius: 64,
      backgroundColor: colors.primary,
      opacity: 0.3,
    },
    circleSmall: {
      position: 'absolute',
      right: 48,
      top: 8,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.white,
      opacity: 0.1,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    kicker: { ...type.labelSm, textTransform: 'uppercase', letterSpacing: 1 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    pillText: { ...type.labelMd },
    title: { ...type.headlineMd },
    meta: { ...type.bodySm, color: colors.onPrimaryContainer },
  }),
);
