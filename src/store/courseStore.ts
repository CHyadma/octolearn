import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { api } from '../api/client';
import type { CourseData } from '../domain/types';
import { validateCourse } from '../domain/validate';

export const COURSE_ID = 'eng-a1';
const CACHE_KEY = 'octolearn-course-cache';

interface CourseStore {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: CourseData | null;
  /** True when the server was unreachable and we are showing the cached copy. */
  offline: boolean;
  load: () => Promise<void>;
}

/** Course content comes from the API (SQLite); last good copy is cached for offline use. */
export const useCourse = create<CourseStore>((set, get) => ({
  status: 'idle',
  data: null,
  offline: false,

  load: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const data: CourseData = await api.course(COURSE_ID);
      const errors = validateCourse(data);
      if (errors.length) throw new Error(`Invalid course: ${errors.join('; ')}`);
      set({ status: 'ready', data, offline: false });
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data)).catch(() => {});
    } catch (e) {
      console.warn('[course] load failed', e);
      const cached = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
      if (cached) set({ status: 'ready', data: JSON.parse(cached) as CourseData, offline: true });
      else set({ status: 'error', data: null });
    }
  },
}));

/** Course data for screens rendered behind the root loading gate. */
export function useCourseData(): CourseData {
  const data = useCourse((s) => s.data);
  if (!data) throw new Error('useCourseData() used before the course was loaded');
  return data;
}
