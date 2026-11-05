import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';
import { Button } from './Button';

export interface LessonVideoHandle {
  pause: () => void;
}

interface Props {
  url: string;
  /** Fallback duration (seconds) from content JSON until metadata loads. */
  durationSec: number;
  /** Called with the furthest watched fraction (0..1). */
  onProgress: (fraction: number) => void;
}

/**
 * Video player with native controls (play/pause, seek, fullscreen) plus
 * loading and error overlays. Reports watch progress via `timeUpdate`.
 */
export const LessonVideo = forwardRef<LessonVideoHandle, Props>(function LessonVideo({ url, durationSec, onProgress }, ref) {
  const player = useVideoPlayer(url ? { uri: url } : null, (p) => {
    p.timeUpdateEventInterval = 0.5;
  });
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const [retrying, setRetrying] = useState(false);

  useImperativeHandle(ref, () => ({ pause: () => player.pause() }), [player]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration > 0 ? player.duration : durationSec;
    if (duration > 0) onProgress(Math.min(1, currentTime / duration));
  });
  useEventListener(player, 'playToEnd', () => onProgress(1));

  const retry = async () => {
    setRetrying(true);
    try {
      await player.replaceAsync({ uri: url });
    } finally {
      setRetrying(false);
    }
  };

  const failed = !url || status === 'error';
  const loading = !failed && (status === 'loading' || retrying);

  return (
    <View style={styles.frame}>
      {!failed && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture={false}
        />
      )}
      {loading && (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.overlayText}>Видео ачаалж байна…</Text>
        </View>
      )}
      {failed && (
        <View style={styles.overlay}>
          <Ionicons name="cloud-offline" size={40} color={colors.white} />
          <Text style={styles.overlayText}>
            {url ? 'Видео ачаалагдсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.' : 'Энэ хичээлд видео байхгүй байна.'}
          </Text>
          {__DEV__ && error?.message ? <Text style={styles.debug}>{error.message}</Text> : null}
          {url ? <Button label="Дахин оролдох" variant="secondary" onPress={retry} style={styles.retry} /> : null}
        </View>
      )}
    </View>
  );
});

const styles = themed(() =>
  StyleSheet.create({
    frame: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: '#111',
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      padding: space.lg,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    overlayText: { ...type.body, color: colors.white, textAlign: 'center' },
    debug: { ...type.caption, color: '#bbb' },
    retry: { marginTop: space.sm, minWidth: 200 },
  }),
);
