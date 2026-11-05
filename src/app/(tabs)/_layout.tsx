import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useScheme } from '../../store/themeStore';
import { colors, radius, space, themed, type } from '../../theme';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<
  string,
  {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconActive: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { label: 'Хичээл', icon: 'school-outline', iconActive: 'school' },
  profile: { label: 'Профайл', icon: 'person-outline', iconActive: 'person' },
};

/** Bottom navigation (design: active tab is an indigo pill). */
function TabBar({ state, navigateToTab }: Pick<BottomTabBarProps, 'state' | 'navigateToTab'>) {
  useScheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => !focused && navigateToTab(route.key)}
            style={({ pressed }) => [styles.tab, focused && styles.tabActive, pressed && { transform: [{ translateY: 2 }] }]}
          >
            <Ionicons
              name={focused ? tab.iconActive : tab.icon}
              size={24}
              color={focused ? colors.onPrimaryContainer : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.label,
                {
                  color: focused ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  useScheme();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar state={props.state} navigateToTab={props.navigateToTab} />}>
      <Tabs.Screen name="index" options={{ title: 'Хичээл' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профайл' }} />
    </Tabs>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: space.margin,
      paddingTop: space.sm,
      backgroundColor: colors.surfaceLowest,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -2 },
      elevation: 8,
    },
    tab: {
      minWidth: 96,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.md,
      paddingVertical: space.xs,
      borderRadius: radius.md,
    },
    tabActive: { backgroundColor: colors.primaryContainer },
    label: { ...type.labelSm, marginTop: 2, letterSpacing: 0.3 },
  }),
);
