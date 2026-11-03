import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '../../components/Button';
import { OptionButton, type OptionState } from '../../components/OptionButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StateView } from '../../components/StateView';
import { courseData } from '../../data/course';
import { findQuiz } from '../../domain/progress';
import type { Quiz } from '../../domain/types';
import { useProgress, usePath } from '../../store/progressStore';
import { colors, radius, space, type } from '../../theme';

type Phase =
  | { kind: 'question'; index: number; selected: number | null; checked: boolean; correct: number }
  | { kind: 'result'; correct: number; passed: boolean; xpGained: number };

const start = (): Phase => ({ kind: 'question', index: 0, selected: null, checked: false, correct: 0 });

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { nodes } = usePath();
  const submitQuiz = useProgress((s) => s.submitQuiz);
  const [phase, setPhase] = useState<Phase>(start);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const found = id ? findQuiz(courseData, id) : null;
  const node = nodes.find((n) => n.id === id);

  if (!found || !node) {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView kind="error" title="Шалгалт олдсонгүй" actionLabel="Нүүр рүү буцах" onAction={close} />
      </SafeAreaView>
    );
  }
  if (node.status === 'locked' && phase.kind !== 'result') {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView
          kind="locked"
          title="Шалгалт түгжээтэй"
          message="Бүлгийн бүх хичээлийг дуусгасны дараа шалгалт нээгдэнэ."
          actionLabel="Буцах"
          onAction={close}
        />
      </SafeAreaView>
    );
  }
  const { quiz, unitIndex } = found;
  if (quiz.questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView kind="empty" title="Асуулт алга" message="Энэ шалгалтад асуулт нэмэгдээгүй байна." actionLabel="Буцах" onAction={close} />
      </SafeAreaView>
    );
  }

  if (phase.kind === 'result') {
    return (
      <SafeAreaView style={styles.safe}>
        <QuizResult
          quiz={quiz}
          correct={phase.correct}
          passed={phase.passed}
          xpGained={phase.xpGained}
          nextUnitTitle={courseData.units[unitIndex + 1]?.title}
          onContinue={close}
          onRetry={() => setPhase(start())}
        />
      </SafeAreaView>
    );
  }

  const q = quiz.questions[phase.index];
  const total = quiz.questions.length;
  const isRight = phase.selected === q.answerIndex;

  const optionState = (i: number): OptionState => {
    if (!phase.checked) return phase.selected === i ? 'selected' : 'idle';
    if (i === q.answerIndex) return 'correct';
    if (i === phase.selected) return 'wrong';
    return 'dimmed';
  };

  const onPrimary = () => {
    if (!phase.checked) {
      setPhase({ ...phase, checked: true, correct: phase.correct + (isRight ? 1 : 0) });
      return;
    }
    if (phase.index + 1 < total) {
      setPhase({ ...phase, index: phase.index + 1, selected: null, checked: false });
      return;
    }
    const { passed, xpGained } = submitQuiz(quiz.id, phase.correct);
    setPhase({ kind: 'result', correct: phase.correct, passed, xpGained });
  };

  const answered = phase.index + (phase.checked ? 1 : 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader onClose={close} progress={answered / total} caption={`Асуулт ${phase.index + 1} / ${total}`} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>{quiz.title}</Text>
        <Text style={styles.question}>{q.text}</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {q.options.map((opt, i) => (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              state={optionState(i)}
              disabled={phase.checked}
              onPress={() => setPhase({ ...phase, selected: i })}
            />
          ))}
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          phase.checked && { backgroundColor: isRight ? colors.greenSoft : colors.redSoft, borderTopColor: 'transparent' },
        ]}
      >
        {phase.checked && (
          <View style={styles.feedback} accessibilityLiveRegion="polite">
            <Ionicons
              name={isRight ? 'checkmark-circle' : 'close-circle'}
              size={30}
              color={isRight ? colors.greenDark : colors.redDark}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.feedbackTitle, { color: isRight ? colors.greenDark : colors.redDark }]}>
                {isRight ? 'Зөв байна!' : 'Буруу байна'}
              </Text>
              {!isRight && (
                <Text style={[styles.feedbackBody, { color: colors.redDark }]}>Зөв хариулт: {q.options[q.answerIndex]}</Text>
              )}
            </View>
          </View>
        )}
        <Button
          testID="quiz-primary"
          label={!phase.checked ? 'Шалгах' : phase.index + 1 < total ? 'Дараах' : 'Үр дүн харах'}
          variant={!phase.checked ? 'success' : isRight ? 'success' : 'danger'}
          disabled={phase.selected === null}
          onPress={onPrimary}
        />
      </View>
    </SafeAreaView>
  );
}

function QuizResult({
  quiz,
  correct,
  passed,
  xpGained,
  nextUnitTitle,
  onContinue,
  onRetry,
}: {
  quiz: Quiz;
  correct: number;
  passed: boolean;
  xpGained: number;
  nextUnitTitle?: string;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const total = quiz.questions.length;
  const percent = Math.round((correct / total) * 100);
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true }).start();
  }, [pop]);

  return (
    <View style={styles.result} testID="quiz-result">
      <View style={styles.resultTop}>
        <Animated.View
          style={[styles.trophy, { backgroundColor: passed ? colors.gold : colors.locked, transform: [{ scale: pop }] }]}
        >
          <Ionicons name={passed ? 'trophy' : 'refresh'} size={64} color={passed ? colors.white : colors.lockedIcon} />
        </Animated.View>
        <Text style={[styles.resultTitle, { color: passed ? colors.greenDark : colors.text }]}>
          {passed ? 'Шалгалтад тэнцлээ!' : 'Бага зэрэг дутлаа'}
        </Text>
        <Text style={styles.resultSub}>
          {passed
            ? nextUnitTitle
              ? `${nextUnitTitle} нээгдлээ.`
              : 'Сайн байна!'
            : `Тэнцэхийн тулд ${quiz.passPercent}% буюу түүнээс дээш зөв хариулах хэрэгтэй.`}
        </Text>
        <View style={styles.statsRow}>
          <ResultStat label="Оноо" value={`${correct} / ${total}`} color={colors.blue} />
          <ResultStat label="Хувь" value={`${percent}%`} color={passed ? colors.green : colors.red} />
          <ResultStat label="XP" value={`+${xpGained}`} color={colors.goldDark} />
        </View>
      </View>
      <View style={styles.resultActions}>
        <Button testID="quiz-continue" label="Үргэлжлүүлэх" variant="success" onPress={onContinue} />
        <Button testID="quiz-retry" label="Дахин өгөх" variant="secondary" onPress={onRetry} />
      </View>
    </View>
  );
}

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.stat, { borderColor: color }]}>
      <Text style={[styles.statLabel, { backgroundColor: color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  kicker: { ...type.caption, textTransform: 'uppercase', letterSpacing: 1 },
  question: { ...type.h1, lineHeight: 34 },
  options: { gap: space.md },
  footer: { padding: space.lg, gap: space.md, borderTopWidth: 2, borderTopColor: colors.border },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: space.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  feedbackTitle: { ...type.h2 },
  feedbackBody: { ...type.body },
  result: { flex: 1, padding: space.lg, justifyContent: 'space-between', maxWidth: 640, width: '100%', alignSelf: 'center' },
  resultTop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  trophy: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { ...type.h1, textAlign: 'center' },
  resultSub: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: space.md, marginTop: space.lg, alignSelf: 'stretch' },
  stat: { flex: 1, borderWidth: 2, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center' },
  statLabel: { ...type.caption, color: colors.white, alignSelf: 'stretch', textAlign: 'center', paddingVertical: 4 },
  statValue: { ...type.h2, paddingVertical: space.md },
  resultActions: { gap: space.md },
});
