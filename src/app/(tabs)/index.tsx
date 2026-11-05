import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CourseTopBar } from '../../components/CourseTopBar';
import { NODE_ROW_HEIGHT, PathNodeButton } from '../../components/PathNodeButton';
import { useToast } from '../../components/Toast';
import { UnitHeader } from '../../components/UnitHeader';
import { UnitHeroCard } from '../../components/UnitHeroCard';
import { courseProgress, findQuiz, LESSON_XP, QUIZ_XP_PER_CORRECT, streak } from '../../domain/progress';
import type { PathNode } from '../../domain/types';
import { useCourse } from '../../store/courseStore';
import { usePath } from '../../store/progressStore';
import { useScheme } from '../../store/themeStore';
import { cardShadow, colors, radius, space, themed, type } from '../../theme';

/** Horizontal offsets (× amplitude) that give the path its zigzag. */
const ZIGZAG = [0, 0.55, 0.8, 0.35, -0.35, -0.8, -0.55];
const MAX_WIDTH = 480;

/** Dashed curve through the node centres (design: "Organic Curving SVG Connector Path"). */
function connectorPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
  }
  return d;
}

export default function PathwayScreen() {
  useScheme();
  const router = useRouter();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const { nodes, state, course: courseData } = usePath();
  const offline = useCourse((s) => s.offline);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const unitY = useRef<Record<number, number>>({});
  const [pathWidth, setPathWidth] = useState(Math.min(width, MAX_WIDTH));

  const progress = courseProgress(courseData, state);
  const currentStreak = streak(state.activity, new Date());
  const amplitude = pathWidth * 0.2;
  const active = nodes.find((n) => n.status === 'active');
  const currentUnitIndex = active?.unitIndex ?? Math.max(0, courseData.units.filter((u) => !u.comingSoon).length - 1);
  const currentUnit = courseData.units[currentUnitIndex];

  const byUnit = useMemo(
    () =>
      courseData.units.map((u, i) => ({
        unit: u,
        nodes: nodes.filter((n) => n.unitIndex === i),
      })),
    [nodes, courseData],
  );

  // P1: bring the active node into view whenever the path is shown.
  const scrollToActive = useCallback(() => {
    if (!active) return;
    const idx = byUnit[active.unitIndex].nodes.findIndex((n) => n.id === active.id);
    const y = (unitY.current[active.unitIndex] ?? 0) + HEADER_H + idx * NODE_ROW_HEIGHT;
    scrollRef.current?.scrollTo({
      y: Math.max(0, y - height * 0.25),
      animated: true,
    });
  }, [active, byUnit, height]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(scrollToActive, 350);
      return () => clearTimeout(t);
    }, [scrollToActive]),
  );

  const openNode = (node: PathNode) => {
    if (node.status === 'locked') {
      if (node.lockReason === 'comingSoon') toast('Энэ бүлэг тун удахгүй нээгдэнэ', 'time');
      else if (node.kind === 'quiz') toast('Бүлгийн 5 хичээлийг дуусгаад шалгалт өгнө үү');
      else toast('Өмнөх хичээлээ эхлээд дуусгана уу');
      return;
    }
    router.push(node.kind === 'quiz' ? `/quiz/${node.id}` : `/lesson/${node.id}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.frame}>
        <CourseTopBar xp={state.xp} streak={currentStreak} />
        {offline && (
          <View style={styles.offline} accessibilityLiveRegion="polite">
            <Ionicons name="cloud-offline" size={16} color={colors.outline} />
            <Text style={styles.offlineText}>Офлайн горим — хадгалсан хичээлүүдийг харуулж байна</Text>
          </View>
        )}
        <UnitHeroCard
          unitNumber={currentUnitIndex + 1}
          title={currentUnit.title.replace(/^Бүлэг \d+:\s*/, '')}
          completed={progress.completed}
          total={progress.total}
          percent={progress.percent}
        />
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} testID="pathway">
          {byUnit.map(({ unit, nodes: unitNodes }, ui) => {
            const points = unitNodes.map((_, i) => ({
              x: pathWidth / 2 + ZIGZAG[i % ZIGZAG.length] * amplitude,
              y: i * NODE_ROW_HEIGHT + NODE_ROW_HEIGHT / 2,
            }));
            return (
              <View key={unit.id} onLayout={(e) => (unitY.current[ui] = e.nativeEvent.layout.y)}>
                <View style={{ height: HEADER_H, justifyContent: 'center' }}>
                  <UnitHeader title={unit.title} description={unit.description} locked={unitNodes.every((n) => n.status === 'locked')} />
                </View>
                <View onLayout={(e) => setPathWidth(e.nativeEvent.layout.width)}>
                  <Svg pointerEvents="none" width={pathWidth} height={unitNodes.length * NODE_ROW_HEIGHT} style={StyleSheet.absoluteFill}>
                    <Path
                      d={connectorPath(points)}
                      stroke={colors.outlineVariant}
                      strokeOpacity={0.55}
                      strokeWidth={8}
                      strokeDasharray="10 10"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                  {unitNodes.map((node, i) => {
                    const offset = ZIGZAG[i % ZIGZAG.length];
                    return (
                      <View
                        key={node.id}
                        style={{
                          transform: [{ translateX: offset * amplitude }],
                        }}
                      >
                        <PathNodeButton node={node} onPress={openNode} calloutSide={offset >= 0 ? 'left' : 'right'} />
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {active ? (
            <Pressable onPress={() => openNode(active)} style={styles.nextCard} accessibilityRole="button" testID="next-card">
              <View style={styles.nextIcon}>
                <Ionicons name={active.kind === 'quiz' ? 'trophy' : 'play'} size={24} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextTitle}>{active.kind === 'quiz' ? 'Бүлгийн шалгалт' : 'Дараагийн хичээл'}</Text>
                <Text style={styles.nextSub} numberOfLines={1}>
                  {active.title}
                </Text>
              </View>
              <View style={styles.xpChip}>
                <Text style={styles.xpChipText}>
                  +
                  {active.kind === 'quiz' ? QUIZ_XP_PER_CORRECT * (findQuiz(courseData, active.id)?.quiz.questions.length ?? 0) : LESSON_XP}{' '}
                  XP
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.nextCard}>
              <View style={styles.nextIcon}>
                <Ionicons name="ribbon" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.nextSub, { flex: 1 }]}>Бүх нээлттэй бүлгийг дуусгалаа! Шинэ бүлэг удахгүй.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const HEADER_H = 76;

const styles = themed(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    frame: {
      flex: 1,
      width: '100%',
      maxWidth: MAX_WIDTH,
      alignSelf: 'center',
      backgroundColor: colors.background,
    },
    scroll: { paddingBottom: space.xl },
    offline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: space.sm,
      backgroundColor: colors.surfaceLow,
    },
    offlineText: { ...type.bodySm },
    nextCard: {
      ...cardShadow,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginHorizontal: space.margin,
      marginTop: space.lg,
      padding: space.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    nextIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: 'rgba(108,248,187,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextTitle: { ...type.labelLg },
    nextSub: { ...type.bodySm },
    xpChip: {
      backgroundColor: colors.surfaceContainer,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    xpChipText: { ...type.labelMd, color: colors.primary },
  }),
);
