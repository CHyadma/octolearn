import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { API_URL } from '../api/config';
import { StateView } from '../components/StateView';
import { ToastProvider } from '../components/Toast';
import { useAuth } from '../store/authStore';
import { useCourse } from '../store/courseStore';
import { useProgress, useProgressHydrated } from '../store/progressStore';
import { startProgressSync } from '../store/sync';
import { useScheme } from '../store/themeStore';
import { colors } from '../theme';

export default function RootLayout() {
  const scheme = useScheme();
  const hydrated = useProgressHydrated();
  // If a font fails to load we continue with the system font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const fontsReady = fontsLoaded || !!fontError;
  const courseStatus = useCourse((s) => s.status);
  const loadCourse = useCourse((s) => s.load);
  const authStatus = useAuth((s) => s.status);
  const userId = useAuth((s) => s.user?.id ?? null);
  const restore = useAuth((s) => s.restore);

  const ready = fontsReady && hydrated && courseStatus === 'ready' && authStatus !== 'loading';
  const signedIn = authStatus === 'signedIn';

  useEffect(() => {
    loadCourse();
    restore();
  }, [loadCourse, restore]);

  // Per-user progress: bind local progress to the signed-in account, then sync it with the server.
  useEffect(() => {
    if (!ready || !signedIn || !userId) return;
    useProgress.getState().bindToUser(userId);
    return startProgressSync();
  }, [ready, signedIn, userId]);

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        {ready ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="lesson/[id]"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="quiz/[id]"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: false,
                }}
              />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="login" options={{ animation: 'fade' }} />
            </Stack.Protected>
          </Stack>
        ) : !fontsReady ? (
          // No text until the custom font is registered (iOS errors on unknown font families).
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            {courseStatus === 'error' ? (
              <StateView
                kind="error"
                title="Сервертэй холбогдож чадсангүй"
                message={`Сервер ажиллаж байгаа эсэх, утас болон компьютер нэг Wi-Fi-д байгаа эсэхийг шалгана уу.\n${API_URL}`}
                actionLabel="Дахин оролдох"
                onAction={loadCourse}
              />
            ) : (
              <StateView kind="loading" title="OctoLearn" message="Ачаалж байна…" />
            )}
          </View>
        )}
      </ToastProvider>
    </SafeAreaProvider>
  );
}
