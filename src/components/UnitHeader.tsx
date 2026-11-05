import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';

interface Props {
  title: string;
  description: string;
  locked: boolean;
}

/** Section divider between chapters on the path. */
export function UnitHeader({ title, description, locked }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.line} />
      <View style={[styles.pill, locked && styles.pillLocked]}>
        {locked && <Ionicons name="lock-closed" size={14} color={colors.outline} />}
        <View>
          <Text style={[styles.title, locked && { color: colors.outline }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.desc} numberOfLines={1}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      marginHorizontal: space.margin,
      marginTop: space.lg,
      marginBottom: space.md,
    },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: colors.surfaceHigh,
      borderRadius: 1,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '78%',
      backgroundColor: colors.surfaceLowest,
      borderWidth: 1,
      borderColor: colors.surfaceHigh,
      borderRadius: radius.md,
      paddingHorizontal: space.md,
      paddingVertical: 6,
    },
    pillLocked: { backgroundColor: colors.surfaceLow },
    title: { ...type.labelMd, color: colors.primary, textAlign: 'center' },
    desc: { ...type.bodySm, fontSize: 12, textAlign: 'center' },
  }),
);
