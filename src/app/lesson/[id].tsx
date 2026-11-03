import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '../../components/Button';
import { LessonVideo, type LessonVideoHandle } from '../../components/LessonVideo';
import { ProgressBar } from '../../components/ProgressBar';
import { RewardModal } from '../../components/RewardModal';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StateView } from '../../components/StateView';
import { courseData } from '../../data/course';
import { findLesson, WATCH_THRESHOLD } from '../../domain/progress';
import { useProgress, usePath } from '../../store/progressStore';
import { colors, radius, space, type } from '../../theme';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { nodes } = usePath();
  const completeLesson = useProgress((s) => s.completeLesson);
  const videoRef = useRef<LessonVideoHandle>(null);

  const [watched, setWatched] = useState(0);
  const [reward, setReward] = useState<{ xp: number; next: string } | null>(null);
  const onProgress = useCallback((f: number) => setWatched((w) => (f > w ? f : w)), []);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const found = id ? findLesson(courseData, id) : null;
  const node = nodes.find((n) => n.id === id);

  if (!found || !node) {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView kind="error" title="Хичээл олдсонгүй" actionLabel="Нүүр рүү буцах" onAction={close} />
      </SafeAreaView>
    );
  }
  // Reward modal is open → node is already "completed"; don't flash the lock screen.
  if (node.status === 'locked' && !reward) {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView
          kind="locked"
          title="Хичээл түгжээтэй"
          message="Өмнөх хичээлээ эхлээд дуусгана уу."
          actionLabel="Буцах"
          onAction={close}
        />
      </SafeAreaView>
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
    const next = isLast ? `${unit.quiz.title} нээгдлээ!` : `Дараагийн хичээл: ${unit.lessons[index + 1].title}`;
    setReward({ xp, next });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onClose={close} caption={`Бүлэг ${unitIndex + 1} · Хичээл ${index + 1} / ${unit.lessons.length}`} />
      <ScrollView contentContainerStyle={styles.body}>
        <LessonVideo ref={videoRef} url={lesson.videoUrl} durationSec={lesson.durationSec} onProgress={onProgress} />
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.desc}>{lesson.description}</Text>

        <View style={styles.watchCard}>
          <View style={styles.watchRow}>
            <Ionicons
              name={canFinish ? 'checkmark-circle' : 'eye'}
              size={20}
              color={canFinish ? colors.green : colors.textMuted}
            />
            <Text style={styles.watchText}>
              {alreadyDone
                ? 'Энэ хичээлийг өмнө нь дуусгасан'
                : canFinish
                  ? 'Бэлэн! Хичээлээ дуусгаарай'
                  : `Үзсэн ${pct}% · ${Math.round(WATCH_THRESHOLD * 100)}% хүрэхэд дуусгах боломжтой`}
            </Text>
          </View>
          {!alreadyDone && <ProgressBar value={watched} height={10} color={canFinish ? colors.green : colors.blue} />}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          testID="finish-lesson"
          label={alreadyDone ? 'Буцах' : 'Дуусгах'}
          variant="success"
          disabled={!canFinish}
          onPress={alreadyDone ? close : finish}
        />
      </View>
      <RewardModal
        visible={!!reward}
        title="Хичээл дууслаа!"
        xp={reward?.xp ?? 0}
        subtitle={reward?.next}
        onContinue={() => {
          setReward(null);
          close();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { ...type.h1, marginTop: space.sm },
  desc: { ...type.body, color: colors.textMuted, lineHeight: 22 },
  watchCard: {
    marginTop: space.sm,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    gap: space.md,
  },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  watchText: { ...type.body, flex: 1 },
  footer: {
    padding: space.lg,
    borderTopWidth: 2,
    borderTopColor: colors.border,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
});
