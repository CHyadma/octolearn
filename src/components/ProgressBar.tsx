import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors, radius, themed } from '../theme';

interface Props {
  /** 0..1 */
  value: number;
  color?: string;
  height?: number;
  track?: string;
}

/** Rounded bar that animates smoothly whenever `value` changes. */
export function ProgressBar({ value, color = colors.green, height = 16, track = colors.border }: Props) {
  const anim = useRef(new Animated.Value(value)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, value]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { height, backgroundColor: track, borderRadius: radius.pill }]}
    >
      <Animated.View style={[styles.fill, { width, backgroundColor: color, borderRadius: radius.pill }]} />
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    track: { width: '100%', overflow: 'hidden' },
    fill: { height: '100%' },
  }),
);
