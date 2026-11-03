import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, type } from '../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  xp: number;
  subtitle?: string;
  onContinue: () => void;
}

/** Celebration sheet shown after finishing a lesson. */
export function RewardModal({ visible, title, xp, subtitle, onContinue }: Props) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
  }, [pop, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
            <Ionicons name="star" size={56} color={colors.white} />
          </Animated.View>
          <Text style={styles.title}>{title}</Text>
          <Animated.View
            style={[
              styles.xpPill,
              { opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
            ]}
          >
            <Ionicons name="flash" size={22} color={colors.goldDark} />
            <Text style={styles.xpText}>{xp > 0 ? `+${xp} XP` : 'Давтлаа!'}</Text>
          </Animated.View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Button label="Үргэлжлүүлэх" variant="success" onPress={onContinue} style={styles.btn} testID="reward-continue" />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg + 8,
    borderTopRightRadius: radius.lg + 8,
    padding: space.xl,
    paddingBottom: space.xxl + 8,
    alignItems: 'center',
    gap: space.md,
  },
  badge: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.gold,
    borderBottomWidth: 7,
    borderBottomColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -72,
  },
  title: { ...type.h1, textAlign: 'center', color: colors.greenDark },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4CC',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  xpText: { ...type.h2, color: colors.goldDark },
  subtitle: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  btn: { alignSelf: 'stretch', marginTop: space.sm },
});
