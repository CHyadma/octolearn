import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as P from '../domain/progress';
import type { ProgressState } from '../domain/types';
import { useCourse, useCourseData } from './courseStore';

export type StoredProgress = ProgressState & {
  /** ms timestamp of the last local change; used for last-write-wins sync with the server. */
  updatedAt: number;
};

type PersistedProgress = StoredProgress & {
  /** User id the local progress belongs to (null = not signed in yet). */
  ownerId: string | null;
};

interface Actions {
  completeLesson: (lessonId: string) => number;
  submitQuiz: (quizId: string, correct: number) => { passed: boolean; xpGained: number };
  reset: () => void;
  /** Replace local progress with a newer copy from the server. */
  adopt: (remote: StoredProgress) => void;
  /** Called on sign-in: drops local progress if it belongs to a different account. */
  bindToUser: (userId: string) => void;
}

const today = () => P.dateKey(new Date());

export const useProgress = create<PersistedProgress & Actions>()(
  persist(
    (set, get) => ({
      ...P.emptyProgress(),
      updatedAt: 0,
      ownerId: null,

      completeLesson: (lessonId) => {
        const { state, xpGained } = P.completeLesson(get(), lessonId, today());
        set({ ...state, updatedAt: Date.now() });
        return xpGained;
      },

      submitQuiz: (quizId, correct) => {
        const course = useCourse.getState().data;
        const found = course && P.findQuiz(course, quizId);
        if (!found) return { passed: false, xpGained: 0 };
        const { state, passed, xpGained } = P.submitQuiz(get(), found.quiz, correct, today());
        set({ ...state, updatedAt: Date.now() });
        return { passed, xpGained };
      },

      reset: () => set({ ...P.emptyProgress(), updatedAt: Date.now() }),

      adopt: ({ completedLessonIds, quizResults, xp, activity, updatedAt }) =>
        set({ completedLessonIds, quizResults, xp, activity, updatedAt }),

      bindToUser: (userId) => {
        if (get().ownerId === userId) return;
        // updatedAt 0 → the first sync adopts whatever the server has for this user.
        set({ ...P.emptyProgress(), updatedAt: 0, ownerId: userId });
      },
    }),
    {
      name: 'octolearn-progress',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted) => {
        const s = persisted as Partial<PersistedProgress>;
        return { ...P.emptyProgress(), ...s, updatedAt: s.updatedAt ?? 0, ownerId: s.ownerId ?? null } as PersistedProgress;
      },
      partialize: ({ completedLessonIds, quizResults, xp, activity, updatedAt, ownerId }) => ({
        completedLessonIds,
        quizResults,
        xp,
        activity,
        updatedAt,
        ownerId,
      }),
    },
  ),
);

export function snapshot(): StoredProgress {
  const { completedLessonIds, quizResults, xp, activity, updatedAt } = useProgress.getState();
  return { completedLessonIds, quizResults, xp, activity, updatedAt };
}

/** True once the persisted progress has been read from disk. */
export function useProgressHydrated() {
  const [hydrated, setHydrated] = useState(useProgress.persist.hasHydrated());
  useEffect(() => {
    const unsub = useProgress.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useProgress.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

/** Path nodes derived from the current progress (recomputed on change). */
export function usePath() {
  const course = useCourseData();
  const completedLessonIds = useProgress((s) => s.completedLessonIds);
  const quizResults = useProgress((s) => s.quizResults);
  const xp = useProgress((s) => s.xp);
  const activity = useProgress((s) => s.activity);
  return useMemo(() => {
    const state = { completedLessonIds, quizResults, xp, activity };
    return { nodes: P.buildPath(course, state), state, course };
  }, [course, completedLessonIds, quizResults, xp, activity]);
}
