import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, HIT, space, type } from '../theme';
import { ProgressBar } from './ProgressBar';

interface Props {
  onClose: () => void;
  /** Small caption, e.g. "Бүлэг 2 · Хичээл 3 / 5" */
  caption?: string;
  /** Optional 0..1 progress shown next to the close button. */
  progress?: number;
}

/** Close (X) + caption/progress row used by full-screen lesson & quiz flows. */
export function ScreenHeader({ onClose, caption, progress }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Буцах"
        style={styles.close}
        hitSlop={8}
        testID="screen-close"
      >
        <Ionicons name="close" size={30} color={colors.lockedIcon} />
      </Pressable>
      <View style={styles.center}>
        {progress !== undefined ? <ProgressBar value={progress} /> : null}
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, paddingVertical: space.sm, gap: space.sm },
  close: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, gap: 6, paddingRight: space.lg },
  caption: { ...type.caption },
});
