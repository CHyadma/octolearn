import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeScreen } from '../../components/SafeScreen';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '../../components/Button';
import { OptionButton, type OptionState } from '../../components/OptionButton';
import { ResultView } from '../../components/ResultView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StateView } from '../../components/StateView';
import { findQuiz, QUIZ_XP_PER_CORRECT, streak } from '../../domain/progress';
import { useProgress, usePath } from '../../store/progressStore';
import { useScheme } from '../../store/themeStore';
import { colors, radius, space, themed, type } from '../../theme';

type Phase =
  | {
      kind: 'question';
      index: number;
      selected: number | null;
      checked: boolean;
      correct: number;
    }
  | { kind: 'result'; correct: number; passed: boolean; xpGained: number };

const start = (): Phase => ({
  kind: 'question',
  index: 0,
  selected: null,
  checked: false,
  correct: 0,
});

export default function QuizScreen() {
  useScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { nodes, state, course: courseData } = usePath();
  const submitQuiz = useProgress((s) => s.submitQuiz);
  const [phase, setPhase] = useState<Phase>(start);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const found = id ? findQuiz(courseData, id) : null;
  const node = nodes.find((n) => n.id === id);

  if (!found || !node) {
    return (
      <SafeScreen style={styles.safe}>
        <StateView kind="error" title="Шалгалт олдсонгүй" actionLabel="Нүүр рүү буцах" onAction={close} />
      </SafeScreen>
    );
  }
  if (node.status === 'locked' && phase.kind !== 'result') {
    return (
      <SafeScreen style={styles.safe}>
        <StateView
          kind="locked"
          title="Шалгалт түгжээтэй"
          message="Бүлгийн бүх хичээлийг дуусгасны дараа шалгалт нээгдэнэ."
          actionLabel="Буцах"
          onAction={close}
        />
      </SafeScreen>
    );
  }
  const { quiz, unitIndex } = found;
  const total = quiz.questions.length;
  if (total === 0) {
    return (
      <SafeScreen style={styles.safe}>
        <StateView
          kind="empty"
          title="Асуулт алга"
          message="Энэ шалгалтад асуулт нэмэгдээгүй байна."
          actionLabel="Буцах"
          onAction={close}
        />
      </SafeScreen>
    );
  }

  if (phase.kind === 'result') {
    const percent = Math.round((phase.correct / total) * 100);
    const nextUnit = courseData.units[unitIndex + 1];
    const days = streak(state.activity, new Date());
    return (
      <SafeScreen style={[styles.safe, { backgroundColor: colors.surface }]}>
        <ResultView
          testID="quiz-result"
          success={phase.passed}
          title={phase.passed ? 'Шалгалтад тэнцлээ!' : 'Бага зэрэг дутлаа'}
          subtitle={
            phase.passed
              ? nextUnit && !nextUnit.comingSoon
                ? `${nextUnit.title} нээгдлээ.`
                : 'Энэ бүлгийг амжилттай дүүргэлээ!'
              : `Тэнцэхийн тулд ${quiz.passPercent}% буюу түүнээс дээш зөв хариулах хэрэгтэй.`
          }
          xp={phase.xpGained}
          xpTitle="Шалгалтын оноо"
          xpSubtitle={
            phase.xpGained > 0
              ? `Шинэ зөв хариулт бүрт ${QUIZ_XP_PER_CORRECT} XP`
              : phase.passed
                ? 'Энэ оноог өмнө нь авсан'
                : 'Тэнцсэн үед XP олгоно'
          }
          stats={[
            {
              label: 'Оновч',
              icon: 'checkmark-done',
              color: phase.passed ? colors.secondary : colors.error,
              value: `${phase.correct} / ${total}`,
              progress: phase.correct / total,
            },
            {
              label: 'Цуврал',
              icon: 'flame',
              color: colors.tertiaryContainer,
              value: `${days}`,
              unit: 'өдөр',
              footnote: days > 0 ? 'Хадгалагдлаа! 🔥' : undefined,
            },
          ]}
          tip={
            phase.passed
              ? `${percent}% зөв! Дараагийн бүлэгт ч ингэж амжилт гаргаарай.`
              : 'Бүлгийн хичээлүүдээ дахин үзээд шалгалтаа давтаж өгөөрэй.'
          }
          primary={{
            label: 'Үргэлжлүүлэх',
            onPress: close,
            testID: 'quiz-continue',
          }}
          secondary={{
            label: 'Дахин өгөх',
            onPress: () => setPhase(start()),
            testID: 'quiz-retry',
          }}
        />
      </SafeScreen>
    );
  }

  const q = quiz.questions[phase.index];
  const isRight = phase.selected === q.answerIndex;

  const optionState = (i: number): OptionState => {
    if (!phase.checked) return phase.selected === i ? 'selected' : 'idle';
    if (i === q.answerIndex) return 'correct';
    if (i === phase.selected) return 'wrong';
    return 'dimmed';
  };

  const onPrimary = () => {
    if (!phase.checked) {
      setPhase({
        ...phase,
        checked: true,
        correct: phase.correct + (isRight ? 1 : 0),
      });
      return;
    }
    if (phase.index + 1 < total) {
      setPhase({
        ...phase,
        index: phase.index + 1,
        selected: null,
        checked: false,
      });
      return;
    }
    const { passed, xpGained } = submitQuiz(quiz.id, phase.correct);
    setPhase({ kind: 'result', correct: phase.correct, passed, xpGained });
  };

  const answered = phase.index + (phase.checked ? 1 : 0);

  return (
    <SafeScreen style={styles.safe}>
      <View style={styles.frame}>
        <ScreenHeader
          onClose={close}
          progress={answered / total}
          trailing={
            <View style={styles.scoreChip} accessibilityLabel={`${phase.correct} зөв хариулт`}>
              <Ionicons name="checkmark-circle" size={18} color={colors.secondary} />
              <Text style={styles.scoreText}>{phase.correct}</Text>
            </View>
          }
        />
        <View style={styles.metaRow}>
          <View style={styles.counter}>
            <View style={styles.dot} />
            <Text style={styles.counterText}>
              Асуулт {phase.index + 1} / {total}
            </Text>
          </View>
          <View style={styles.xpMeta}>
            <Ionicons name="flash" size={14} color={colors.tertiaryFixedDim} />
            <Text style={styles.xpMetaText}>+{QUIZ_XP_PER_CORRECT} XP</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View>
            <Text style={styles.question}>{q.text}</Text>
            <Text style={styles.hint}>Зөв хариултыг сонгоно уу.</Text>
          </View>
          <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="Хариултын хувилбарууд">
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
          {!phase.checked && (
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
              <Text style={styles.tipText}>
                <Text style={styles.tipStrong}>Зөвлөгөө: </Text>
                Тэнцэхийн тулд {quiz.passPercent}%-аас дээш зөв хариулна.
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            phase.checked && {
              backgroundColor: isRight ? colors.successSoft : colors.errorContainer,
            },
          ]}
        >
          {phase.checked && (
            <View style={styles.feedback} accessibilityLiveRegion="polite">
              <View
                style={[
                  styles.feedbackIcon,
                  {
                    backgroundColor: isRight ? colors.secondary : colors.error,
                  },
                ]}
              >
                <Ionicons name={isRight ? 'checkmark' : 'close'} size={22} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.feedbackTitle,
                    {
                      color: isRight ? colors.secondary : colors.onErrorContainer,
                    },
                  ]}
                >
                  {isRight ? 'Зөв байна!' : 'Буруу байна'}
                </Text>
                {!isRight && (
                  <Text style={[styles.feedbackBody, { color: colors.onErrorContainer }]}>Зөв хариулт: {q.options[q.answerIndex]}</Text>
                )}
              </View>
            </View>
          )}
          <Button
            testID="quiz-primary"
            label={!phase.checked ? 'Шалгах' : phase.index + 1 < total ? 'Дараах' : 'Үр дүн харах'}
            variant={!phase.checked ? 'primary' : isRight ? 'success' : 'danger'}
            icon="arrow-forward"
            disabled={phase.selected === null}
            onPress={onPrimary}
          />
        </View>
      </View>
    </SafeScreen>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surfaceLowest },
    frame: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space.margin,
      paddingTop: space.xs,
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
    scoreChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceLow,
      borderWidth: 1,
      borderColor: colors.surfaceContainer,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    scoreText: { ...type.labelMd, color: colors.secondary },
    body: {
      paddingHorizontal: space.margin,
      paddingTop: space.md,
      paddingBottom: space.lg,
      gap: space.lg,
    },
    question: { ...type.headlineXl, letterSpacing: -0.3 },
    hint: { ...type.bodyMd, color: colors.onSurfaceVariant, marginTop: space.sm },
    options: { gap: space.md },
    tip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceLow,
      borderWidth: 1,
      borderColor: colors.surfaceContainer,
    },
    tipText: { ...type.bodySm, color: colors.onSurfaceVariant, flex: 1 },
    tipStrong: { fontFamily: type.labelMd.fontFamily, color: colors.onSurface },
    footer: {
      paddingHorizontal: space.margin,
      paddingTop: space.md,
      paddingBottom: space.lg,
      gap: space.md,
      backgroundColor: colors.surfaceLowest,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: -10 },
    },
    feedback: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    feedbackIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    feedbackTitle: { ...type.headlineMd },
    feedbackBody: { ...type.bodyMd },
  }),
);
