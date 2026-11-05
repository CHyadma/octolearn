import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom';

/**
 * Safe-area wrapper for full-screen modal routes. The native SafeAreaView can
 * report 0 insets inside an iOS fullScreenModal, which puts the close button
 * under the status bar, so we pad with the window insets from the root provider.
 */
export function SafeScreen({
  children,
  style,
  edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}) {
  const insets = useSafeAreaInsets();
  const fallback = initialWindowMetrics?.insets;
  const top = Math.max(insets.top, fallback?.top ?? 0);
  const bottom = Math.max(insets.bottom, fallback?.bottom ?? 0);
  return (
    <View
      style={[{ flex: 1 }, style, { paddingTop: edges.includes('top') ? top : 0, paddingBottom: edges.includes('bottom') ? bottom : 0 }]}
    >
      {children}
    </View>
  );
}
