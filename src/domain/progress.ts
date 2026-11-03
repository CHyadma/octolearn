import type {
  CourseData,
  Lesson,
  PathNode,
  ProgressState,
  Quiz,
  QuizResult,
  Unit,
} from './types';

export const LESSON_XP = 10;
export const QUIZ_XP_PER_CORRECT = 5;
export const XP_PER_LEVEL = 50;
/** Share of the video that must be watched before "Дуусгах" unlocks. */
export const WATCH_THRESHOLD = 0.9;

export const emptyProgress = (): ProgressState => ({
  completedLessonIds: [],
  quizResults: {},
  xp: 0,
  activity: {},
});

// ---------- dates ----------

/** Local calendar day as YYYY-MM-DD (not UTC, so streaks follow the user's day). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// ---------- lookups ----------

export function findLesson(
  data: CourseData,
  lessonId: string,
): { unit: Unit; unitIndex: number; lesson: Lesson; index: number } | null {
  for (let u = 0; u < data.units.length; u++) {
    const unit = data.units[u];
    const index = unit.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { unit, unitIndex: u, lesson: unit.lessons[index], index };
  }
  return null;
}

export function findQuiz(
  data: CourseData,
  quizId: string,
): { unit: Unit; unitIndex: number; quiz: Quiz } | null {
  const unitIndex = data.units.findIndex((u) => u.quiz.id === quizId);
  if (unitIndex < 0) return null;
  const unit = data.units[unitIndex];
  return { unit, unitIndex, quiz: unit.quiz };
}

// ---------- path / unlock logic ----------

export function isPassed(correct: number, total: number, passPercent: number): boolean {
  if (total <= 0) return false;
  return (correct / total) * 100 >= passPercent;
}

/**
 * Flattens the course into one ordered path. The rule is strictly linear:
 * everything before the first unfinished node is completed, that node is
 * active, everything after it is locked. A unit marked `comingSoon` is always
 * locked.
 */
export function buildPath(data: CourseData, progress: ProgressState): PathNode[] {
  const done = new Set(progress.completedLessonIds);
  const nodes: PathNode[] = [];
  let activeAssigned = false;

  const push = (base: Omit<PathNode, 'status' | 'lockReason'>, isDone: boolean, comingSoon: boolean) => {
    if (comingSoon) {
      nodes.push({ ...base, status: 'locked', lockReason: 'comingSoon' });
    } else if (isDone && !activeAssigned) {
      nodes.push({ ...base, status: 'completed' });
    } else if (!activeAssigned) {
      activeAssigned = true;
      nodes.push({ ...base, status: 'active' });
    } else {
      nodes.push({ ...base, status: 'locked', lockReason: 'previous' });
    }
  };

  data.units.forEach((unit, unitIndex) => {
    const comingSoon = !!unit.comingSoon;
    unit.lessons.forEach((lesson, i) => {
      push(
        { id: lesson.id, kind: 'lesson', unitId: unit.id, unitIndex, position: i + 1, title: lesson.title },
        done.has(lesson.id),
        comingSoon,
      );
    });
    push(
      {
        id: unit.quiz.id,
        kind: 'quiz',
        unitId: unit.id,
        unitIndex,
        position: unit.lessons.length + 1,
        title: unit.quiz.title,
      },
      !!progress.quizResults[unit.quiz.id]?.passed,
      comingSoon,
    );
  });
  return nodes;
}

export function nodeStatus(data: CourseData, progress: ProgressState, nodeId: string) {
  return buildPath(data, progress).find((n) => n.id === nodeId) ?? null;
}

// ---------- mutations (pure) ----------

function addActivity(activity: Record<string, number>, day: string, xp: number) {
  // Any finished lesson/quiz counts as activity for the streak, even with 0 XP.
  return { ...activity, [day]: (activity[day] ?? 0) + xp };
}

export function completeLesson(
  state: ProgressState,
  lessonId: string,
  day: string,
): { state: ProgressState; xpGained: number } {
  if (state.completedLessonIds.includes(lessonId)) {
    return { state: { ...state, activity: addActivity(state.activity, day, 0) }, xpGained: 0 };
  }
  return {
    xpGained: LESSON_XP,
    state: {
      ...state,
      completedLessonIds: [...state.completedLessonIds, lessonId],
      xp: state.xp + LESSON_XP,
      activity: addActivity(state.activity, day, LESSON_XP),
    },
  };
}

/**
 * XP for a quiz is only paid for *new* correct answers on a passing attempt:
 * first pass with 4/5 → 20 XP, a later 5/5 → +5 XP. Retakes can't farm XP.
 */
export function submitQuiz(
  state: ProgressState,
  quiz: Quiz,
  correct: number,
  day: string,
): { state: ProgressState; xpGained: number; passed: boolean } {
  const total = quiz.questions.length;
  const passed = isPassed(correct, total, quiz.passPercent);
  const prev = state.quizResults[quiz.id];
  const paidFor = prev?.passed ? prev.bestCorrect : 0;
  const xpGained = passed ? Math.max(0, correct - paidFor) * QUIZ_XP_PER_CORRECT : 0;

  const result: QuizResult = {
    bestCorrect: Math.max(prev?.bestCorrect ?? 0, correct),
    lastCorrect: correct,
    total,
    attempts: (prev?.attempts ?? 0) + 1,
    passed: (prev?.passed ?? false) || passed,
  };
  return {
    passed,
    xpGained,
    state: {
      ...state,
      xp: state.xp + xpGained,
      quizResults: { ...state.quizResults, [quiz.id]: result },
      activity: addActivity(state.activity, day, xpGained),
    },
  };
}

// ---------- derived stats ----------

export function courseProgress(data: CourseData, progress: ProgressState) {
  const available = data.units.filter((u) => !u.comingSoon).flatMap((u) => u.lessons.map((l) => l.id));
  const done = new Set(progress.completedLessonIds);
  const completed = available.filter((id) => done.has(id)).length;
  const total = available.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  return { level, into, needed: XP_PER_LEVEL, toNext: XP_PER_LEVEL - into };
}

/** Consecutive active days ending today (or yesterday, so the streak survives until midnight). */
export function streak(activity: Record<string, number>, today: Date): number {
  let cursor = today;
  if (!(dateKey(cursor) in activity)) cursor = addDays(cursor, -1);
  let count = 0;
  while (dateKey(cursor) in activity) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

const WEEKDAYS = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

export function lastDays(activity: Record<string, number>, today: Date, n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(today, i - (n - 1));
    const key = dateKey(d);
    return { key, label: WEEKDAYS[d.getDay()], xp: activity[key] ?? 0, isToday: i === n - 1 };
  });
}

export function profileStats(data: CourseData, progress: ProgressState, today: Date) {
  const results = Object.values(progress.quizResults);
  const avgQuizPercent = results.length
    ? Math.round((results.reduce((s, r) => s + r.bestCorrect / r.total, 0) / results.length) * 100)
    : null;
  const totalQuizzes = data.units.filter((u) => !u.comingSoon).length;
  return {
    xp: progress.xp,
    ...levelInfo(progress.xp),
    course: courseProgress(data, progress),
    passedQuizzes: results.filter((r) => r.passed).length,
    totalQuizzes,
    avgQuizPercent,
    streak: streak(progress.activity, today),
    week: lastDays(progress.activity, today),
  };
}
