import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { authErrorMessage, useAuth } from '../store/authStore';
import { useScheme } from '../store/themeStore';
import { cardShadow, colors, HIT, radius, space, themed, type } from '../theme';

type Mode = 'login' | 'register';

const DEMO = { email: 'demo@octolearn.online', password: 'demo1234' };

/** Single screen for sign-in and sign-up (one main action per screen, a toggle to switch). */
export default function LoginScreen() {
  useScheme();
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);

  const isRegister = mode === 'register';
  const canSubmit = !busy && email.trim() && password && (!isRegister || name.trim());

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      // Root layout's Stack.Protected switches to the app once signed in.
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="school" size={44} color={colors.white} />
            </View>
            <Text style={styles.brand}>OctoLearn</Text>
            <Text style={styles.tagline}>{isRegister ? 'Шинэ бүртгэл үүсгэх' : 'Тавтай морил! Нэвтэрч суралцаарай'}</Text>
          </View>

          <View style={styles.segment} accessibilityRole="tablist">
            {(['login', 'register'] as const).map((m) => (
              <Pressable
                key={m}
                testID={`tab-${m}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
                onPress={() => switchMode(m)}
                style={[styles.segmentItem, mode === m && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>{m === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.form}>
            {isRegister && (
              <TextField
                testID="input-name"
                label="Нэр"
                icon="person"
                value={name}
                onChangeText={setName}
                placeholder="Таны нэр"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                maxLength={40}
              />
            )}
            <TextField
              ref={emailRef}
              testID="input-email"
              label="Имэйл"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              testID="input-password"
              label="Нууц үг"
              icon="lock-closed"
              secret
              value={password}
              onChangeText={setPassword}
              placeholder={isRegister ? 'Дор хаяж 6 тэмдэгт' : '••••••'}
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              textContentType={isRegister ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
            />

            {error && (
              <View style={styles.error} accessibilityLiveRegion="polite" testID="auth-error">
                <Ionicons name="alert-circle" size={20} color={colors.redDark} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              testID="auth-submit"
              label={busy ? 'Түр хүлээнэ үү…' : isRegister ? 'Бүртгүүлэх' : 'Нэвтрэх'}
              variant="success"
              disabled={!canSubmit}
              onPress={submit}
            />
          </View>

          {!isRegister && (
            <Pressable
              testID="demo-fill"
              style={styles.demo}
              onPress={() => {
                setEmail(DEMO.email);
                setPassword(DEMO.password);
                setError(null);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.demoText}>
                Туршилтын эрх: {DEMO.email} / {DEMO.password}
              </Text>
              <Text style={styles.demoLink}>Бөглөх</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    body: {
      padding: space.xl,
      gap: space.xl,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
      flexGrow: 1,
      justifyContent: 'center',
    },
    hero: { alignItems: 'center', gap: space.sm },
    logo: {
      width: 88,
      height: 88,
      borderRadius: 28,
      backgroundColor: colors.primaryContainer,
      borderBottomWidth: 6,
      borderBottomColor: colors.primaryShadow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: { ...type.headlineXl, color: colors.primary, marginTop: space.sm },
    tagline: {
      ...type.bodyMd,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.pill,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      minHeight: HIT - 4,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentActive: { backgroundColor: colors.surfaceLowest, ...cardShadow },
    segmentText: { ...type.labelLg, color: colors.onSurfaceVariant },
    segmentTextActive: { color: colors.primary },
    form: { gap: space.lg },
    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: colors.errorContainer,
      padding: space.md,
      borderRadius: radius.md,
    },
    errorText: { ...type.bodyMd, color: colors.onErrorContainer, flex: 1 },
    demo: {
      alignItems: 'center',
      gap: 2,
      padding: space.sm,
      minHeight: HIT,
      justifyContent: 'center',
    },
    demoText: { ...type.caption, textAlign: 'center' },
    demoLink: { ...type.labelMd, color: colors.primary },
  }),
);
