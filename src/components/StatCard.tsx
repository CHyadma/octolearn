import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, type } from '../theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  label: string;
}

export function StatCard({ icon, color, value, label }: Props) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={24} color={color} />
      <View style={{ flex: 1 }}>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 72,
  },
  value: { ...type.h2 },
  label: { ...type.caption },
});
