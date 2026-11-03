import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ProgressBar } from '../../components/ProgressBar';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../components/Toast';
import { WeeklyChart } from '../../components/WeeklyChart';
import { courseData } from '../../data/course';
import { profileStats } from '../../domain/progress';
import { useProgress, usePath } from '../../store/progressStore';
import { colors, radius, space, type } from '../../theme';

export default function ProfileScreen() {
  const { state } = usePath();
  const reset = useProgress((s) => s.reset);
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const { user } = courseData;
  const s = profileStats(courseData, state, new Date());

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} accessibilityLabel={user.name} />
          ) : (
            <View style={[styles.avatar, styles.initials]} accessibilityLabel={user.name}>
              <Text style={styles.initialsText}>{user.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.course}>{courseData.course.title}</Text>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>Түвшин {s.level}</Text>
            <Text style={styles.levelHint}>Дараагийн түвшин хүртэл {s.toNext} XP</Text>
          </View>
          <ProgressBar value={s.into / s.needed} color={colors.gold} height={14} />
        </View>

        <View style={styles.grid}>
          <StatCard icon="flash" color={colors.gold} value={`${s.xp}`} label="Нийт XP" />
          <StatCard icon="flame" color={colors.orange} value={`${s.streak} өдөр`} label="Streak" />
          <StatCard icon="book" color={colors.blue} value={`${s.course.completed} / ${s.course.total}`} label="Дууссан хичээл" />
          <StatCard icon="trophy" color={colors.goldDark} value={`${s.passedQuizzes} / ${s.totalQuizzes}`} label="Тэнцсэн шалгалт" />
          <StatCard icon="ribbon" color={colors.brand} value={s.avgQuizPercent === null ? '—' : `${s.avgQuizPercent}%`} label="Шалгалтын дундаж" />
          <StatCard icon="checkmark-circle" color={colors.green} value={`${s.course.percent}%`} label="Курсийн ахиц" />
        </View>

        <WeeklyChart days={s.week} />

        <Button testID="reset" label="Ахицыг дахин эхлүүлэх" variant="secondary" onPress={() => setConfirming(true)} />
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        title="Ахицыг устгах уу?"
        message="Бүх хичээл, шалгалт, XP тэглэгдэнэ. Энэ үйлдлийг буцаах боломжгүй."
        confirmLabel="Тийм, устгах"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          reset();
          setConfirming(false);
          toast('Ахиц шинээр эхэллээ', 'refresh');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  header: { alignItems: 'center', gap: 4, paddingVertical: space.md },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  initials: {
    backgroundColor: colors.brandSoft,
    borderWidth: 3,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontSize: 40, fontWeight: '800', color: colors.brand },
  name: { ...type.h1, marginTop: space.sm },
  course: { ...type.caption },
  levelCard: { backgroundColor: '#FFF8E0', borderRadius: radius.lg, padding: space.lg, gap: space.md },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: space.sm },
  levelText: { ...type.h2, color: colors.goldDark },
  levelHint: { ...type.caption },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
});
