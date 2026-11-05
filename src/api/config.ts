import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PORT = 4000;

/**
 * Where the OctoLearn API lives.
 * 1. EXPO_PUBLIC_API_URL (e.g. in .env) always wins — use it for a deployed server or tunnel mode.
 * 2. In Expo Go we reuse the dev machine's LAN IP that Metro is served from, so a phone
 *    on the same Wi-Fi reaches `npm run server` on the Mac without any config.
 * 3. Simulator / web fallbacks.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${PORT}`;
  }
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${PORT}` : `http://localhost:${PORT}`;
}

export const API_URL = resolveApiUrl();
