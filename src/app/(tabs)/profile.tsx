import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourseTopBar } from '../../components/CourseTopBar';
import { ProgressBar } from '../../components/ProgressBar';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../components/Toast';
import { WeeklyChart } from '../../components/WeeklyChart';
import { profileStats } from '../../domain/progress';
import { useAuth } from '../../store/authStore';
import { useProgress, usePath } from '../../store/progressStore';
import { useScheme, useTheme } from '../../store/themeStore';
import { cardShadow, colors, radius, space, themed, type } from '../../theme';

export default function ProfileScreen() {
  const scheme = useScheme();
  const toggleTheme = useTheme((s) => s.toggle);
  const { state, course: courseData } = usePath();
  const reset = useProgress((s) => s.reset);
  const toast = useToast();
  const [confirming, setConfirming] = useState<null | 'reset' | 'logout'>(null);
  const authUser = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const user = {
    name: authUser?.name ?? courseData.user?.name ?? 'Суралцагч',
    avatarUrl: authUser?.avatarUrl ?? null,
    email: authUser?.email,
  };
  const s = profileStats(courseData, state, new Date());
  const today = s.week[s.week.length - 1]?.xp ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.frame}>
        <CourseTopBar xp={s.xp} streak={s.streak} />
        <ScrollView contentContainerStyle={styles.body}>
          {/* Profile header card */}
          <View style={[styles.card, styles.header]}>
            <View style={styles.actions}>
              <IconAction
                icon={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                label={scheme === 'dark' ? 'Цайвар горим' : 'Бараан горим'}
                onPress={toggleTheme}
                testID="theme-toggle"
              />
              <IconAction icon="refresh" label="Ахиц шинэчлэх" onPress={() => setConfirming('reset')} testID="reset" />
              <IconAction icon="log-out-outline" label="Гарах" onPress={() => setConfirming('logout')} testID="logout" tone="danger" />
            </View>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarRing}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} accessibilityLabel={user.name} />
                ) : (
                  <View style={[styles.avatar, styles.initials]} accessibilityLabel={user.name}>
                    <Text style={styles.initialsText}>{user.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.verified}>
                <Ionicons name="shield-checkmark" size={14} color={colors.white} />
              </View>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>
              Түвшин {s.level}
              {user.email ? ` · ${user.email}` : ''}
            </Text>
          </View>

          {/* 2x2 metrics */}
          <View>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Үзүүлэлт</Text>
              <Text style={styles.sectionMeta}>{courseData.course.title}</Text>
            </View>
            <View style={styles.grid}>
              <StatCard
                icon="sparkles"
                color={colors.primary}
                value={`${s.xp}`}
                label="Нийт XP"
                badge={today > 0 ? `+${today} өнөөдөр` : undefined}
                badgeColor={colors.secondary}
                badgeBg="rgba(108,248,187,0.2)"
              />
              <StatCard
                icon="flame"
                color={colors.tertiaryContainer}
                value={`${s.streak} өдөр`}
                label="Тасралтгүй цуврал"
                badge={s.streak > 0 ? 'Идэвхтэй' : undefined}
                badgeBg="rgba(255,221,184,0.4)"
              />
              <StatCard
                icon="school"
                color={colors.primaryContainer}
                value={`${s.course.completed} / ${s.course.total}`}
                label="Дууссан хичээл"
                badge={`${s.course.percent}% ахиц`}
                badgeColor={colors.primary}
                badgeBg="rgba(227,223,255,0.4)"
              />
              <StatCard
                icon="trophy"
                color={colors.secondary}
                value={s.avgQuizPercent === null ? '—' : `${s.avgQuizPercent}%`}
                label="Шалгалтын дундаж"
                badge={`${s.passedQuizzes} / ${s.totalQuizzes} тэнцсэн`}
                badgeBg="rgba(108,248,187,0.2)"
              />
            </View>
          </View>

          <WeeklyChart days={s.week} />

          {/* Next milestone */}
          <View style={[styles.card, styles.milestone]}>
            <View style={styles.milestoneIcon}>
              <Ionicons name="ribbon" size={24} color={colors.tertiary} />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.milestoneRow}>
                <Text style={styles.milestoneTitle}>Дараагийн шат: Түвшин {s.level + 1}</Text>
                <Text style={styles.milestoneXp}>
                  {s.into} / {s.needed} XP
                </Text>
              </View>
              <ProgressBar value={s.into / s.needed} height={8} color={colors.primaryContainer} track={colors.surfaceContainer} />
            </View>
          </View>
        </ScrollView>
      </View>

      <ConfirmDialog
        visible={confirming === 'reset'}
        title="Ахицыг устгах уу?"
        message="Бүх хичээл, шалгалт, XP тэглэгдэнэ. Энэ үйлдлийг буцаах боломжгүй."
        confirmLabel="Тийм, устгах"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          reset();
          setConfirming(null);
          toast('Ахиц шинээр эхэллээ', 'refresh');
        }}
      />
      <ConfirmDialog
        visible={confirming === 'logout'}
        title="Гарах уу?"
        message="Таны ахиц сервер дээр хадгалагдсан тул дахин нэвтрэхэд сэргэнэ."
        confirmLabel="Гарах"
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          logout();
        }}
      />
    </SafeAreaView>
  );
}

function IconAction({
  icon,
  label,
  onPress,
  testID,
  tone = 'neutral',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  testID?: string;
  tone?: 'neutral' | 'danger';
}) {
  const fg = tone === 'danger' ? colors.error : colors.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: colors.surfaceHighest, transform: [{ scale: 0.94 }] }]}
    >
      <Ionicons name={icon} size={20} color={fg} />
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    frame: {
      flex: 1,
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      backgroundColor: colors.background,
    },
    body: {
      paddingHorizontal: space.margin,
      paddingTop: space.lg,
      paddingBottom: space.xl,
      gap: space.lg,
    },
    card: {
      ...cardShadow,
      backgroundColor: colors.surfaceLowest,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    header: { padding: space.lg, alignItems: 'center' },
    avatarWrap: { marginBottom: 12 },
    avatarRing: {
      padding: 4,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: colors.primaryContainer,
    },
    avatar: { width: 88, height: 88, borderRadius: 44 },
    initials: {
      backgroundColor: colors.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      ...type.headlineXl,
      fontSize: 34,
      lineHeight: 40,
      color: colors.primary,
    },
    verified: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: colors.surfaceLowest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { ...type.headlineMd, fontFamily: type.headlineXl.fontFamily },
    meta: { ...type.bodySm, marginTop: 4, textAlign: 'center' },
    actions: { position: 'absolute', top: space.sm, right: space.sm, flexDirection: 'row', gap: space.sm, zIndex: 2 },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: space.sm,
      paddingHorizontal: 4,
    },
    sectionTitle: { ...type.labelLg },
    sectionMeta: { ...type.labelSm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    milestone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      padding: space.md,
    },
    milestoneIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.tertiaryFixed,
      alignItems: 'center',
      justifyContent: 'center',
    },
    milestoneRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space.sm,
    },
    milestoneTitle: { ...type.labelMd, flexShrink: 1 },
    milestoneXp: { ...type.labelSm, color: colors.primary },
  }),
);
