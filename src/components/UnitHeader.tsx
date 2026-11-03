import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, type } from '../theme';

interface Props {
  title: string;
  description: string;
  color: string;
  locked: boolean;
}

export function UnitHeader({ title, description, color, locked }: Props) {
  const bg = locked ? colors.lockedIcon : color;
  return (
    <View style={[styles.wrap, { backgroundColor: bg }]} accessibilityRole="header">
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      {locked && <Ionicons name="lock-closed" size={22} color={colors.white} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: space.lg,
    marginHorizontal: space.lg,
    marginTop: space.xl,
    marginBottom: space.lg,
    gap: space.md,
  },
  title: { ...type.h2, color: colors.white },
  desc: { ...type.body, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
});
