import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CourseTopBar } from '../../components/CourseTopBar';
import { PathNodeButton } from '../../components/PathNodeButton';
import { useToast } from '../../components/Toast';
import { UnitHeader } from '../../components/UnitHeader';
import { courseData } from '../../data/course';
import { courseProgress, streak } from '../../domain/progress';
import type { PathNode } from '../../domain/types';
import { usePath } from '../../store/progressStore';
import { colors, space, type } from '../../theme';

/** Horizontal offsets (× amplitude) that give the path its zigzag. */
const ZIGZAG = [0, 0.5, 0.85, 0.5, 0, -0.5, -0.85, -0.5];

export default function PathwayScreen() {
  const router = useRouter();
  const toast = useToast();
  const { width, height } = useWindowDimensions();
  const { nodes, state } = usePath();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const unitY = useRef<Record<number, number>>({});
  const nodeY = useRef<Record<string, number>>({});

  const progress = courseProgress(courseData, state);
  const currentStreak = streak(state.activity, new Date());
  const amplitude = Math.min(width, 480) * 0.22;
  const active = nodes.find((n) => n.status === 'active');
  const finished = !active;

  const byUnit = useMemo(
    () => courseData.units.map((u, i) => ({ unit: u, nodes: nodes.filter((n) => n.unitIndex === i) })),
    [nodes],
  );

  // P1: bring the active node into view whenever the path is shown.
  const scrollToActive = useCallback(() => {
    if (!active) return;
    const y = (unitY.current[active.unitIndex] ?? 0) + (nodeY.current[active.id] ?? 0);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - height * 0.3), animated: true });
  }, [active, height]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(scrollToActive, 350);
      return () => clearTimeout(t);
    }, [scrollToActive]),
  );

  const onNodePress = (node: PathNode) => {
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
      <CourseTopBar {...progress} xp={state.xp} streak={currentStreak} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} testID="pathway">
        <Text style={styles.course}>{courseData.course.title}</Text>
        {byUnit.map(({ unit, nodes: unitNodes }, ui) => (
          <View key={unit.id} onLayout={(e) => (unitY.current[ui] = e.nativeEvent.layout.y)}>
            <UnitHeader
              title={unit.title}
              description={unit.description}
              color={unit.color}
              locked={unitNodes.every((n) => n.status === 'locked')}
            />
            {unitNodes.map((node, i) => (
              <View
                key={node.id}
                onLayout={(e) => (nodeY.current[node.id] = e.nativeEvent.layout.y)}
                style={{ transform: [{ translateX: ZIGZAG[i % ZIGZAG.length] * amplitude }], alignItems: 'center' }}
              >
                <PathNodeButton node={node} unitColor={unit.color} onPress={onNodePress} />
              </View>
            ))}
          </View>
        ))}
        {finished && (
          <View style={styles.done}>
            <Ionicons name="ribbon" size={40} color={colors.gold} />
            <Text style={styles.doneText}>Бүх нээлттэй бүлгийг дуусгалаа! Шинэ бүлэг удахгүй.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 64 },
  course: { ...type.caption, textAlign: 'center', marginTop: space.lg, textTransform: 'uppercase', letterSpacing: 1 },
  done: { alignItems: 'center', gap: space.sm, padding: space.xl },
  doneText: { ...type.body, textAlign: 'center', color: colors.textMuted },
});
