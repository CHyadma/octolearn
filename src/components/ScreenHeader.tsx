import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';
import { ProgressBar } from './ProgressBar';

interface Props {
  onClose: () => void;
  /** Optional caption below the bar */
  caption?: string;
  /** 0..1 progress shown next to the close button (mint track, design: "Segmented Progress Track"). */
  progress?: number;
  /** Right-side slot (e.g. a counter chip). */
  trailing?: ReactNode;
}

/** Close (X) + progress row used by full-screen lesson & quiz flows. */
export function ScreenHeader({ onClose, caption, progress, trailing }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Хаах"
          style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.surfaceLow }]}
          hitSlop={8}
          testID="screen-close"
        >
          <Ionicons name="close" size={26} color={colors.outline} />
        </Pressable>
        {progress !== undefined ? (
          <View style={styles.track}>
            <ProgressBar value={progress} height={8} color={colors.secondaryFixedDim} track="transparent" />
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {trailing}
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: space.margin,
      paddingTop: space.md,
      paddingBottom: space.sm,
      gap: space.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    close: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -8,
    },
    track: {
      flex: 1,
      height: 12,
      padding: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceContainer,
    },
    caption: { ...type.labelSm },
  }),
);
