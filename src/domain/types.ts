/** Content model — mirrors src/data/course.json */
export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  durationSec: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  passPercent: number;
  questions: Question[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  color: string;
  /** Shown on the path but never unlockable (content not ready yet). */
  comingSoon?: boolean;
  lessons: Lesson[];
  quiz: Quiz;
}

export interface CourseData {
  course: { id: string; title: string };
  units: Unit[];
  user: { name: string; avatarUrl: string | null };
}

/** Learner progress — the only thing we persist on device. */
export interface QuizResult {
  bestCorrect: number;
  lastCorrect: number;
  total: number;
  attempts: number;
  passed: boolean;
}

export interface ProgressState {
  completedLessonIds: string[];
  quizResults: Record<string, QuizResult>;
  xp: number;
  /** XP earned per local day, keyed YYYY-MM-DD. Drives streak + weekly chart. */
  activity: Record<string, number>;
}

export type NodeKind = 'lesson' | 'quiz';
export type NodeStatus = 'completed' | 'active' | 'locked';
export type LockReason = 'previous' | 'comingSoon';

export interface PathNode {
  id: string;
  kind: NodeKind;
  unitId: string;
  unitIndex: number;
  /** 1-based lesson number inside its unit (quiz = lessons.length + 1). */
  position: number;
  title: string;
  status: NodeStatus;
  lockReason?: LockReason;
}
