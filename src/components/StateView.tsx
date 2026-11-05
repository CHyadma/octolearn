import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, space, themed, type } from '../theme';
import { Button } from './Button';

interface Props {
  kind: 'loading' | 'error' | 'empty' | 'locked';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons = {
  error: 'alert-circle',
  empty: 'book',
  locked: 'lock-closed',
} as const;

/** Shared loading / empty / error / locked placeholder. */
export function StateView({ kind, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      {kind === 'loading' ? (
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      ) : (
        <Ionicons name={icons[kind]} size={56} color={kind === 'error' ? colors.error : colors.outline} />
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.btn} /> : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space.xl,
      gap: space.md,
    },
    title: { ...type.headlineLg, textAlign: 'center' },
    message: {
      ...type.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    btn: { alignSelf: 'stretch', marginTop: space.md },
  }),
);
