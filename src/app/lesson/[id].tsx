import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeScreen } from '../../components/SafeScreen';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '../../components/Button';
import { LessonVideo, type LessonVideoHandle } from '../../components/LessonVideo';
import { ProgressBar } from '../../components/ProgressBar';
import { RewardModal } from '../../components/RewardModal';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StateView } from '../../components/StateView';
import { findLesson, WATCH_THRESHOLD } from '../../domain/progress';
import { useProgress, usePath } from '../../store/progressStore';
import { useScheme } from '../../store/themeStore';
import { colors, radius, space, themed, type } from '../../theme';

export default function LessonScreen() {
  useScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { nodes, course: courseData } = usePath();
  const completeLesson = useProgress((s) => s.completeLesson);
  const videoRef = useRef<LessonVideoHandle>(null);

  const [watched, setWatched] = useState(0);
  const [reward, setReward] = useState<{
    xp: number;
    next: string;
    unitDone: number;
  } | null>(null);
  const onProgress = useCallback((f: number) => setWatched((w) => (f > w ? f : w)), []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const found = id ? findLesson(courseData, id) : null;
  const node = nodes.find((n) => n.id === id);

  if (!found || !node) {
    return (
      <SafeScreen style={styles.safe}>
        <StateView kind="error" title="Хичээл олдсонгүй" actionLabel="Нүүр рүү буцах" onAction={close} />
      </SafeScreen>
    );
  }
  // Reward modal is open → node is already "completed"; don't flash the lock screen.
  if (node.status === 'locked' && !reward) {
    return (
      <SafeScreen style={styles.safe}>
        <StateView
          kind="locked"
          title="Хичээл түгжээтэй"
          message="Өмнөх хичээлээ эхлээд дуусгана уу."
          actionLabel="Буцах"
          onAction={close}
        />
      </SafeScreen>
    );
  }

  const { unit, unitIndex, lesson, index } = found;
  const alreadyDone = node.status === 'completed' && !reward;
  const canFinish = alreadyDone || watched >= WATCH_THRESHOLD;
  const pct = Math.round(watched * 100);

  const finish = () => {
    videoRef.current?.pause();
    const xp = completeLesson(lesson.id);
    const isLast = index === unit.lessons.length - 1;
    const next = isLast
      ? `Хичээлийг амжилттай дүүргэлээ! ${unit.quiz.title} нээгдлээ`
      : `Хичээлийг амжилттай дүүргэлээ! Дараагийн хичээл: ${unit.lessons[index + 1].title}`;
    const done = new Set([...useProgress.getState().completedLessonIds, lesson.id]);
    setReward({
      xp,
      next,
      unitDone: unit.lessons.filter((l) => done.has(l.id)).length,
    });
  };

  return (
    <SafeScreen style={styles.safe}>
      <ScreenHeader onClose={close} progress={(index + (alreadyDone ? 1 : watched)) / unit.lessons.length} />
      <ScrollView contentContainerStyle={styles.body}>
        <LessonVideo ref={videoRef} url={lesson.videoUrl} durationSec={lesson.durationSec} onProgress={onProgress} />
        <View style={styles.metaRow}>
          <View style={styles.counter}>
            <View style={styles.dot} />
            <Text style={styles.counterText}>
              Бүлэг {unitIndex + 1} · Хичээл {index + 1} / {unit.lessons.length}
            </Text>
          </View>
          <View style={styles.xpMeta}>
            <Ionicons name="flash" size={14} color={colors.tertiaryFixedDim} />
            <Text style={styles.xpMetaText}>+10 XP</Text>
          </View>
        </View>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.desc}>{lesson.description}</Text>

        <View style={styles.watchCard}>
          <View style={styles.watchRow}>
            <View style={[styles.watchIcon, canFinish && { backgroundColor: 'rgba(108,248,187,0.4)' }]}>
              <Ionicons name={canFinish ? 'checkmark-circle' : 'eye'} size={20} color={canFinish ? colors.secondary : colors.primary} />
            </View>
            <Text style={styles.watchText}>
              {alreadyDone
                ? 'Энэ хичээлийг өмнө нь дуусгасан'
                : canFinish
                  ? 'Бэлэн! Хичээлээ дуусгаарай'
                  : `Үзсэн ${pct}% · ${Math.round(WATCH_THRESHOLD * 100)}% хүрэхэд дуусгах боломжтой`}
            </Text>
          </View>
          {!alreadyDone && (
            <ProgressBar
              value={watched}
              height={10}
              color={canFinish ? colors.secondaryFixedDim : colors.primaryContainer}
              track={colors.surfaceContainer}
            />
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          testID="finish-lesson"
          label={alreadyDone ? 'Буцах' : 'Дуусгах'}
          icon={alreadyDone ? undefined : 'arrow-forward'}
          disabled={!canFinish}
          onPress={alreadyDone ? close : finish}
        />
      </View>
      <RewardModal
        visible={!!reward}
        xp={reward?.xp ?? 0}
        subtitle={reward?.next ?? ''}
        unitDone={reward?.unitDone ?? 0}
        unitTotal={unit.lessons.length}
        onContinue={() => {
          setReward(null);
          close();
        }}
      />
    </SafeScreen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceLowest },
    body: {
      paddingHorizontal: space.margin,
      paddingVertical: space.sm,
      gap: space.md,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: space.sm,
    },
    counter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primaryContainer,
    },
    counterText: { ...type.labelSm, color: colors.primary },
    xpMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    xpMetaText: { ...type.labelSm, color: colors.outline },
    title: { ...type.headlineXl, letterSpacing: -0.3 },
    desc: { ...type.bodyMd, color: colors.onSurfaceVariant, marginTop: -8 },
    watchCard: {
      padding: space.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceLow,
      borderWidth: 1,
      borderColor: colors.surfaceContainer,
      gap: 12,
    },
    watchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    watchIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    watchText: { ...type.bodySm, color: colors.onSurfaceVariant, flex: 1 },
    footer: {
      paddingHorizontal: space.margin,
      paddingTop: space.md,
      paddingBottom: space.lg,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
      backgroundColor: colors.surfaceLowest,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: -10 },
    },
  }),
);
