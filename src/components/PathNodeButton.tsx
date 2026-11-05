import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PathNode } from '../domain/types';
import { colors, radius, themed, type } from '../theme';

export const NODE_SIZE = 64;
export const ACTIVE_SIZE = 72;
export const QUIZ_SIZE = 80;
/** Fixed row height so the path connector can be computed. */
export const NODE_ROW_HEIGHT = 104;

interface Props {
  node: PathNode;
  onPress: (node: PathNode) => void;
  /** Which side the "Эхлэх" callout sits on (away from the screen edge). */
  calloutSide: 'left' | 'right';
}

/** One stop on the learning path (design: tactile-node-indigo / -locked / -star). */
export function PathNodeButton({ node, onPress, calloutSide }: Props) {
  const isQuiz = node.kind === 'quiz';
  const { status } = node;
  const active = status === 'active';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, active]);

  const size = isQuiz ? QUIZ_SIZE : active ? ACTIVE_SIZE : NODE_SIZE;
  const statusText = {
    completed: 'дууссан',
    active: 'идэвхтэй',
    locked: 'түгжээтэй',
  }[status];

  let face: {
    bg: string;
    edge: string;
    border?: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
  };
  if (isQuiz) {
    face =
      status === 'locked'
        ? {
            bg: colors.surfaceHigh,
            edge: colors.outlineVariant,
            icon: 'star',
            iconColor: colors.outlineVariant,
          }
        : {
            bg: colors.tertiaryFixed,
            edge: colors.amberShadow,
            border: colors.tertiary,
            icon: status === 'completed' ? 'trophy' : 'star',
            iconColor: colors.tertiary,
          };
  } else if (status === 'completed') {
    face = {
      bg: colors.primaryContainer,
      edge: colors.primaryShadow,
      icon: 'checkmark',
      iconColor: colors.white,
    };
  } else if (active) {
    face = {
      bg: colors.surfaceLowest,
      edge: 'transparent',
      border: colors.primaryContainer,
      icon: 'play',
      iconColor: colors.primary,
    };
  } else {
    face = {
      bg: colors.surfaceHigh,
      edge: colors.outlineVariant,
      icon: 'lock-closed',
      iconColor: colors.outline,
    };
  }

  // Bounce for the callout, ping for the ring.
  const bounce = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -6, 0],
  });
  const ringScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const ringOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  return (
    <View style={styles.row}>
      <View>
        {active && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                width: size + 12,
                height: size + 12,
                borderRadius: (size + 12) / 2,
                left: -6,
                top: -6,
                borderColor: isQuiz ? colors.tertiary : colors.primaryContainer,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        )}
        {active && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.callout,
              calloutSide === 'left' ? { right: size + 12 } : { left: size + 12 },
              { top: size / 2 - 16, transform: [{ translateY: bounce }] },
            ]}
          >
            <Text style={styles.calloutText}>{isQuiz ? 'Шалгалт' : 'Эхлэх'}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.white} />
            <View style={[styles.arrow, calloutSide === 'left' ? styles.arrowRight : styles.arrowLeft]} />
          </Animated.View>
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
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: face.bg,
                  borderWidth: face.border ? 4 : 0,
                  borderColor: face.border,
                  transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.96 : 1 }],
                },
                // 3D edge (design: `box-shadow: 0 5px 0 <edge>`), drawn as a bottom border so it works on Android too.
                active && styles.activeShadow,
                face.edge !== 'transparent' && {
                  borderBottomWidth: pressed ? 3 : 5,
                  borderBottomColor: face.edge,
                },
              ]}
            >
              <Ionicons
                name={face.icon}
                size={isQuiz ? 36 : active ? 36 : status === 'locked' ? 24 : 30}
                color={face.iconColor}
                style={active && !isQuiz ? { marginLeft: 4 } : undefined}
              />
              {isQuiz && status === 'completed' && (
                <View style={styles.badge}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    row: {
      height: NODE_ROW_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    circle: { alignItems: 'center', justifyContent: 'center' },
    activeShadow: {
      shadowColor: colors.primaryContainer,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    ring: { position: 'absolute', borderWidth: 2 },
    callout: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: colors.inverseSurface,
      paddingLeft: 14,
      paddingRight: 10,
      height: 32,
      borderRadius: radius.pill,
      zIndex: 5,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    calloutText: { ...type.labelMd, color: colors.white },
    arrow: {
      position: 'absolute',
      top: 10,
      width: 0,
      height: 0,
      borderTopWidth: 6,
      borderBottomWidth: 6,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    arrowRight: {
      right: -6,
      borderLeftWidth: 6,
      borderLeftColor: colors.inverseSurface,
    },
    arrowLeft: {
      left: -6,
      borderRightWidth: 6,
      borderRightColor: colors.inverseSurface,
    },
    badge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: colors.surfaceLowest,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
);
