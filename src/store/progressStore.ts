import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { courseData } from '../data/course';
import * as P from '../domain/progress';
import type { ProgressState } from '../domain/types';

interface Actions {
  completeLesson: (lessonId: string) => number;
  submitQuiz: (quizId: string, correct: number) => { passed: boolean; xpGained: number };
  reset: () => void;
}

const today = () => P.dateKey(new Date());

export const useProgress = create<ProgressState & Actions>()(
  persist(
    (set, get) => ({
      ...P.emptyProgress(),

      completeLesson: (lessonId) => {
        const { state, xpGained } = P.completeLesson(get(), lessonId, today());
        set(state);
        return xpGained;
      },

      submitQuiz: (quizId, correct) => {
        const found = P.findQuiz(courseData, quizId);
        if (!found) return { passed: false, xpGained: 0 };
        const { state, passed, xpGained } = P.submitQuiz(get(), found.quiz, correct, today());
        set(state);
        return { passed, xpGained };
      },

      reset: () => set(P.emptyProgress()),
    }),
    {
      name: 'octolearn-progress',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ completedLessonIds, quizResults, xp, activity }) => ({
        completedLessonIds,
        quizResults,
        xp,
        activity,
      }),
    },
  ),
);

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
  const completedLessonIds = useProgress((s) => s.completedLessonIds);
  const quizResults = useProgress((s) => s.quizResults);
  const xp = useProgress((s) => s.xp);
  const activity = useProgress((s) => s.activity);
  return useMemo(() => {
    const state = { completedLessonIds, quizResults, xp, activity };
    return { nodes: P.buildPath(courseData, state), state };
  }, [completedLessonIds, quizResults, xp, activity]);
}
