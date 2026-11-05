import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, radius, space, themed, type } from '../theme';
import { Button } from './Button';

export interface ResultStat {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: string;
  unit?: string;
  /** 0..1 — renders a small bar under the value */
  progress?: number;
  footnote?: string;
}

interface Props {
  success: boolean;
  title: string;
  subtitle: string;
  xp: number;
  xpTitle: string;
  xpSubtitle: string;
  stats: ResultStat[];
  tip?: ReactNode;
  primary: { label: string; onPress: () => void; testID?: string };
  secondary?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
}

const CONFETTI = [
  {
    top: 8,
    left: 24,
    size: 12,
    color: colors.primaryContainer,
    round: true,
    delay: 100,
  },
  {
    top: 24,
    right: 20,
    size: 12,
    color: colors.tertiaryFixedDim,
    round: false,
    delay: 400,
  },
  {
    bottom: 20,
    left: 32,
    size: 10,
    color: colors.secondary,
    round: false,
    delay: 700,
  },
  {
    bottom: 12,
    right: 32,
    size: 12,
    color: colors.primaryFixedDim,
    round: true,
    delay: 300,
  },
  {
    top: 92,
    left: -8,
    size: 10,
    color: colors.secondaryContainer,
    round: true,
    delay: 600,
  },
  {
    top: 92,
    right: -8,
    size: 10,
    color: colors.tertiaryFixed,
    round: false,
    delay: 200,
  },
] as const;

/** Celebration / result screen (design: "Хичээлийн үр дүн ба Урамшуулал"). */
export function ResultView({ success, title, subtitle, xp, xpTitle, xpSubtitle, stats, tip, primary, secondary, testID }: Props) {
  const pop = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 70,
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pop, float]);

  const badgeColor = success ? colors.primaryContainer : colors.outline;

  return (
    <View style={styles.root} testID={testID}>
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.badgeWrap, { opacity: pop, transform: [{ scale: pop }] }]}>
          {success &&
            CONFETTI.map((c, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confetti,
                  c,
                  {
                    width: c.size,
                    height: c.size,
                    backgroundColor: c.color,
                    borderRadius: c.round ? c.size / 2 : 2,
                    transform: [
                      { rotate: c.round ? '0deg' : '45deg' },
                      {
                        translateY: float.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, i % 2 ? -6 : 6],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          <View style={styles.badgeOuter}>
            <View style={[styles.badgeInner, { backgroundColor: badgeColor }]}>
              <View style={styles.badgeShine} />
              <Ionicons name={success ? 'checkmark' : 'refresh'} size={56} color={colors.white} />
            </View>
          </View>
          {success && (
            <View style={styles.star}>
              <Ionicons name="star" size={18} color={colors.tertiary} />
            </View>
          )}
        </Animated.View>

        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.cards}>
          <View style={[styles.card, styles.xpCard]}>
            <View style={styles.xpIcon}>
              <Ionicons name="flash" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{xpTitle}</Text>
              <Text style={styles.cardSub}>{xpSubtitle}</Text>
            </View>
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>+{xp} XP</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.card, styles.statCard]}>
                <View style={styles.statHead}>
                  <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={styles.statValue}>
                  {s.value}
                  {s.unit ? <Text style={styles.statUnit}> {s.unit}</Text> : null}
                </Text>
                {s.progress !== undefined ? (
                  <View style={styles.statBarRow}>
                    <View style={styles.statTrack}>
                      <View
                        style={[
                          styles.statFill,
                          {
                            width: `${Math.round(s.progress * 100)}%`,
                            backgroundColor: s.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.statPct, { color: s.color }]}>{Math.round(s.progress * 100)}%</Text>
                  </View>
                ) : s.footnote ? (
                  <Text style={[styles.statFoot, { color: s.color }]} numberOfLines={1}>
                    {s.footnote}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {tip ? (
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Button label={primary.label} onPress={primary.onPress} testID={primary.testID} icon="arrow-forward" />
        {secondary && (
          <Button
            label={secondary.label}
            onPress={secondary.onPress}
            testID={secondary.testID}
            variant="secondary"
            icon="refresh"
            iconLeading
          />
        )}
      </View>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
    },
    glowA: {
      position: 'absolute',
      top: -96,
      alignSelf: 'center',
      width: 320,
      height: 320,
      borderRadius: 160,
      backgroundColor: colors.primaryFixedDim,
      opacity: 0.3,
    },
    glowB: {
      position: 'absolute',
      top: 176,
      alignSelf: 'center',
      width: 256,
      height: 256,
      borderRadius: 128,
      backgroundColor: colors.tertiaryFixedDim,
      opacity: 0.15,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: space.margin,
      paddingVertical: space.lg,
      alignItems: 'center',
    },
    badgeWrap: {
      width: 192,
      height: 192,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.lg,
    },
    confetti: { position: 'absolute' },
    badgeOuter: {
      width: 128,
      height: 128,
      borderRadius: 64,
      padding: 8,
      backgroundColor: colors.surfaceLow,
      borderWidth: 4,
      borderColor: colors.surfaceLowest,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    badgeInner: {
      flex: 1,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    badgeShine: {
      position: 'absolute',
      top: -32,
      right: -32,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    star: {
      position: 'absolute',
      bottom: 22,
      right: 36,
      backgroundColor: colors.tertiaryFixed,
      padding: 6,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.surfaceLowest,
    },
    text: {
      alignItems: 'center',
      paddingHorizontal: space.md,
      marginBottom: space.lg + 4,
      maxWidth: 380,
    },
    title: { ...type.headlineXl, textAlign: 'center', marginBottom: space.sm },
    subtitle: {
      ...type.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    cards: { width: '100%', gap: 12 },
    card: {
      backgroundColor: colors.surfaceLowest,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: radius.xl,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    xpCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: space.md,
    },
    xpIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryFixed,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { ...type.labelMd },
    cardSub: { ...type.bodySm },
    xpPill: {
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: radius.lg,
    },
    xpPillText: { ...type.headlineMd, color: colors.white },
    grid: { flexDirection: 'row', gap: 12 },
    statCard: { flex: 1, padding: 14, gap: 6 },
    statHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statLabel: { ...type.labelSm, textTransform: 'uppercase' },
    statValue: { ...type.headlineLg },
    statUnit: { ...type.bodySm },
    statBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statTrack: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceContainer,
      overflow: 'hidden',
    },
    statFill: { height: '100%', borderRadius: 4 },
    statPct: { ...type.labelSm },
    statFoot: { ...type.bodySm, fontFamily: type.labelMd.fontFamily },
    tip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceLow,
      borderWidth: 1,
      borderColor: colors.surfaceContainer,
      borderRadius: radius.lg,
      paddingHorizontal: space.md,
      paddingVertical: 10,
    },
    tipText: { ...type.bodySm, flex: 1 },
    actions: {
      gap: 12,
      paddingHorizontal: space.margin,
      paddingTop: space.sm,
      paddingBottom: space.lg,
    },
  }),
);
