import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { cardShadow, colors, radius, space, themed, type } from '../theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
  /** Small pill in the top-right corner, e.g. "+10 өнөөдөр". */
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
}

/** Metric card (design: "Stats 2x2 Metric Grid"). */
export function StatCard({ icon, color, value, label, badge, badgeColor = color, badgeBg = colors.surfaceLow }: Props) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.head}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    card: {
      ...cardShadow,
      flexBasis: '46%',
      flexGrow: 1,
      backgroundColor: colors.surfaceLowest,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: space.md,
    },
    head: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: space.sm,
      gap: 4,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      flexShrink: 1,
    },
    badgeText: { ...type.labelSm, letterSpacing: 0 },
    value: { ...type.headlineLg, letterSpacing: -0.3 },
    label: { ...type.bodySm, marginTop: 2 },
  }),
);
