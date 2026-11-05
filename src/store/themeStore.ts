import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyScheme, type ColorScheme } from '../theme';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  /** Scheme currently applied to `colors`. */
  scheme: ColorScheme;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
}

const systemScheme = (): ColorScheme => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
const resolve = (p: ThemePreference): ColorScheme => (p === 'system' ? systemScheme() : p);

// Apply before the first render so screens never flash the wrong palette.
const initial = systemScheme();
applyScheme(initial);

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      scheme: initial,
      setPreference: (preference) => {
        const scheme = resolve(preference);
        // Mutate the shared colors first, then notify subscribers so they re-render with them.
        applyScheme(scheme);
        set({ preference, scheme });
      },
      toggle: () => get().setPreference(get().scheme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'octolearn-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ preference: s.preference }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setPreference(state.preference);
      },
    },
  ),
);

Appearance.addChangeListener(() => {
  const s = useTheme.getState();
  if (s.preference === 'system') s.setPreference('system');
});

/** Subscribe a screen to theme changes; returns the active scheme. */
export const useScheme = () => useTheme((s) => s.scheme);
