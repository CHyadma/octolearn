import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { api, ApiError, configureAuth, type User } from '../api/client';

const TOKEN_KEY = 'octolearn.token';
const USER_KEY = 'octolearn.user';

/** Token lives in the iOS Keychain / Android Keystore; web has no SecureStore, so it uses localStorage. */
const tokenStorage = {
  get: () => (Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY)),
  set: (v: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(TOKEN_KEY, v) : SecureStore.setItemAsync(TOKEN_KEY, v),
  clear: () => (Platform.OS === 'web' ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY)),
};

interface AuthStore {
  status: 'loading' | 'signedOut' | 'signedIn';
  token: string | null;
  user: User | null;
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function persistSession(token: string, user: User) {
  await tokenStorage.set(token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  await tokenStorage.clear().catch(() => {});
  await AsyncStorage.removeItem(USER_KEY).catch(() => {});
}

export const useAuth = create<AuthStore>((set, get) => ({
  status: 'loading',
  token: null,
  user: null,

  /** On app start: reuse the saved token. Works offline with the cached user. */
  restore: async () => {
    const token = await tokenStorage.get().catch(() => null);
    if (!token) return set({ status: 'signedOut' });
    const cached = await AsyncStorage.getItem(USER_KEY).catch(() => null);
    set({ token, user: cached ? (JSON.parse(cached) as User) : null, status: 'signedIn' });
    try {
      const user = await api.me();
      set({ user });
      AsyncStorage.setItem(USER_KEY, JSON.stringify(user)).catch(() => {});
    } catch (e) {
      // 401 is handled by onUnauthorized → signed out. Network errors keep the offline session.
      if (!(e instanceof ApiError) || e.status !== 401) return;
    }
  },

  login: async (email, password) => {
    const { token, user } = await api.login(email.trim(), password);
    await persistSession(token, user);
    set({ token, user, status: 'signedIn' });
  },

  register: async (name, email, password) => {
    const { token, user } = await api.register(name.trim(), email.trim(), password);
    await persistSession(token, user);
    set({ token, user, status: 'signedIn' });
  },

  logout: async () => {
    if (get().token) api.logout().catch(() => {}); // best effort; the local session is cleared regardless
    await clearSession();
    set({ token: null, user: null, status: 'signedOut' });
  },
}));

configureAuth({
  getToken: () => useAuth.getState().token,
  onUnauthorized: () => {
    // Token expired or revoked on the server.
    clearSession();
    useAuth.setState({ token: null, user: null, status: 'signedOut' });
  },
});

/** Human-readable (Mongolian) message for an auth error. */
export function authErrorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Алдаа гарлаа. Дахин оролдоно уу.';
  switch (e.code) {
    case 'invalid_credentials':
      return 'Имэйл эсвэл нууц үг буруу байна.';
    case 'email_taken':
      return 'Энэ имэйлээр бүртгэл үүссэн байна. Нэвтэрнэ үү.';
    case 'validation':
      if (e.fields?.email) return 'Имэйл хаяг буруу байна.';
      if (e.fields?.password) return 'Нууц үг дор хаяж 6 тэмдэгт байна.';
      if (e.fields?.name) return 'Нэрээ оруулна уу.';
      return 'Мэдээллээ шалгана уу.';
    case 'network':
    case 'timeout':
      return 'Сервертэй холбогдож чадсангүй. Интернэт болон серверээ шалгана уу.';
    default:
      return 'Алдаа гарлаа. Дахин оролдоно уу.';
  }
}
