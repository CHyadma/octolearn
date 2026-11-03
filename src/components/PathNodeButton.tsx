import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PathNode } from '../domain/types';
import { colors, space, type } from '../theme';

const SIZE = 72;
const QUIZ_SIZE = 84;

interface Props {
  node: PathNode;
  unitColor: string;
  onPress: (node: PathNode) => void;
}

/** One circle on the zigzag path. Three visual states + a distinct quiz shape. */
export function PathNodeButton({ node, unitColor, onPress }: Props) {
  const isQuiz = node.kind === 'quiz';
  const { status } = node;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'active') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, status]);

  const face =
    status === 'locked'
      ? { bg: colors.locked, edge: colors.lockedDark, icon: colors.lockedIcon }
      : isQuiz
        ? { bg: colors.gold, edge: colors.goldDark, icon: colors.white }
        : status === 'completed'
          ? { bg: colors.green, edge: colors.greenDark, icon: colors.white }
          : { bg: unitColor, edge: shade(unitColor), icon: colors.white };

  const icon: keyof typeof Ionicons.glyphMap =
    status === 'locked'
      ? isQuiz
        ? 'trophy'
        : 'lock-closed'
      : isQuiz
        ? 'trophy'
        : status === 'completed'
          ? 'checkmark'
          : 'play';

  const statusText = { completed: 'дууссан', active: 'идэвхтэй', locked: 'түгжээтэй' }[status];

  return (
    <View style={styles.container}>
      {status === 'active' && (
        <Animated.View
          style={[
            styles.bubble,
            { transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isQuiz ? colors.goldDark : unitColor }]}>
            {isQuiz ? 'ШАЛГАЛТ' : 'ЭХЛЭХ'}
          </Text>
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}
      {status === 'active' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            isQuiz && styles.quizRing,
            {
              borderColor: isQuiz ? colors.gold : unitColor,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
            },
          ]}
        />
      )}
      <Pressable
        testID={`node-${node.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${node.title}, ${statusText}`}
        onPress={() => onPress(node)}
        hitSlop={8}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.circle,
              isQuiz && styles.quizCircle,
              {
                backgroundColor: face.bg,
                borderBottomColor: face.edge,
                borderBottomWidth: pressed ? 3 : 7,
                marginTop: pressed ? 4 : 0,
              },
            ]}
          >
            <Ionicons name={icon} size={isQuiz ? 38 : 32} color={face.icon} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** Darken a hex colour ~20% for the 3D edge. */
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.round(c * 0.78));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'flex-end', height: QUIZ_SIZE + 52 },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  quizCircle: { width: QUIZ_SIZE, height: QUIZ_SIZE, borderRadius: QUIZ_SIZE / 2 },
  quizRing: { width: QUIZ_SIZE + 16, height: QUIZ_SIZE + 16, borderRadius: (QUIZ_SIZE + 16) / 2 },
  ring: {
    position: 'absolute',
    bottom: -8,
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: (SIZE + 16) / 2,
    borderWidth: 6,
  },
  bubble: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 2,
  },
  bubbleText: { ...type.caption, fontWeight: '800', letterSpacing: 1 },
  bubbleTail: {
    position: 'absolute',
    bottom: -7,
    width: 12,
    height: 12,
    backgroundColor: colors.white,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.border,
    transform: [{ rotate: '45deg' }],
  },
});
