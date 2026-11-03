import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StateView } from '../components/StateView';
import { ToastProvider } from '../components/Toast';
import { useProgressHydrated } from '../store/progressStore';
import { colors } from '../theme';

export default function RootLayout() {
  const hydrated = useProgressHydrated();
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ToastProvider>
        {hydrated ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="lesson/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="quiz/[id]" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StateView kind="loading" title="OctoLearn" message="Ахицыг ачаалж байна…" />
          </View>
        )}
      </ToastProvider>
    </SafeAreaProvider>
  );
}
