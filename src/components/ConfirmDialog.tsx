import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, type } from '../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Cross-platform confirm (Alert.alert is a no-op on web). */
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button label={confirmLabel} variant="danger" onPress={onConfirm} testID="confirm-yes" />
          <Button label="Болих" variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: space.xl },
  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.md,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: { ...type.h2, textAlign: 'center' },
  message: { ...type.body, color: colors.textMuted, textAlign: 'center', marginBottom: space.sm },
});
