import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import * as P from '../src/domain/progress.ts';
import { validateCourse } from '../src/domain/validate.ts';
import type { CourseData, ProgressState } from '../src/domain/types.ts';

const course: CourseData = JSON.parse(readFileSync(new URL('../server/seed/course.json', import.meta.url), 'utf8'));
const DAY = '2026-11-03';

const finishLessons = (s: ProgressState, ids: string[]) =>
  ids.reduce((acc, id) => P.completeLesson(acc, id, DAY).state, s);
const unitLessonIds = (u: number) => course.units[u].lessons.map((l) => l.id);

test('course.json is valid', () => {
  assert.deepEqual(validateCourse(course), []);
});

test('fresh progress: first lesson active, everything else locked', () => {
  const path = P.buildPath(course, P.emptyProgress());
  assert.equal(path[0].status, 'active');
  assert.ok(path.slice(1).every((n) => n.status === 'locked'));
  assert.equal(path.filter((n) => n.kind === 'quiz').length, 3);
});

test('completing a lesson gives 10 XP once and unlocks the next one', () => {
  const r1 = P.completeLesson(P.emptyProgress(), 'u1-l1', DAY);
  assert.equal(r1.xpGained, P.LESSON_XP);
  const r2 = P.completeLesson(r1.state, 'u1-l1', DAY);
  assert.equal(r2.xpGained, 0);
  assert.equal(r2.state.xp, 10);
  const path = P.buildPath(course, r2.state);
  assert.equal(path[0].status, 'completed');
  assert.equal(path[1].status, 'active');
});

test('quiz unlocks only after all 5 lessons', () => {
  const four = finishLessons(P.emptyProgress(), unitLessonIds(0).slice(0, 4));
  assert.equal(P.nodeStatus(course, four, 'u1-quiz')?.status, 'locked');
  const five = finishLessons(four, [unitLessonIds(0)[4]]);
  assert.equal(P.nodeStatus(course, five, 'u1-quiz')?.status, 'active');
  assert.equal(P.nodeStatus(course, five, 'u2-l1')?.status, 'locked');
});

test('pass rule: >= 60% passes and unlocks next unit; failing does not', () => {
  const quiz = course.units[0].quiz;
  const ready = finishLessons(P.emptyProgress(), unitLessonIds(0));

  const fail = P.submitQuiz(ready, quiz, 2, DAY);
  assert.equal(fail.passed, false);
  assert.equal(fail.xpGained, 0);
  assert.equal(P.nodeStatus(course, fail.state, 'u1-quiz')?.status, 'active');
  assert.equal(P.nodeStatus(course, fail.state, 'u2-l1')?.status, 'locked');

  const pass = P.submitQuiz(fail.state, quiz, 3, DAY);
  assert.equal(pass.passed, true);
  assert.equal(pass.xpGained, 15);
  assert.equal(pass.state.quizResults[quiz.id].attempts, 2);
  assert.equal(P.nodeStatus(course, pass.state, 'u1-quiz')?.status, 'completed');
  assert.equal(P.nodeStatus(course, pass.state, 'u2-l1')?.status, 'active');
});

test('quiz XP cannot be farmed by retaking', () => {
  const quiz = course.units[0].quiz;
  const ready = finishLessons(P.emptyProgress(), unitLessonIds(0));
  const a = P.submitQuiz(ready, quiz, 4, DAY);
  const b = P.submitQuiz(a.state, quiz, 4, DAY);
  const c = P.submitQuiz(b.state, quiz, 5, DAY);
  assert.deepEqual([a.xpGained, b.xpGained, c.xpGained], [20, 0, 5]);
  // a later failed attempt never re-locks a passed quiz
  const d = P.submitQuiz(c.state, quiz, 0, DAY);
  assert.equal(d.state.quizResults[quiz.id].passed, true);
});

test('coming-soon unit stays locked even after finishing everything', () => {
  let s = finishLessons(P.emptyProgress(), [...unitLessonIds(0), ...unitLessonIds(1)]);
  s = P.submitQuiz(s, course.units[0].quiz, 5, DAY).state;
  s = P.submitQuiz(s, course.units[1].quiz, 5, DAY).state;
  const path = P.buildPath(course, s);
  assert.ok(!path.some((n) => n.status === 'active'));
  assert.ok(path.filter((n) => n.unitId === 'u3').every((n) => n.lockReason === 'comingSoon'));
  assert.deepEqual(P.courseProgress(course, s), { completed: 10, total: 10, percent: 100 });
});

test('streak counts consecutive days and survives until end of today', () => {
  const today = new Date(2026, 10, 3, 12);
  const act = { '2026-11-01': 10, '2026-11-02': 20 };
  assert.equal(P.streak(act, today), 2); // nothing today yet, yesterday still counts
  assert.equal(P.streak({ ...act, '2026-11-03': 5 }, today), 3);
  assert.equal(P.streak({ '2026-10-30': 5 }, today), 0);
});

test('level and weekly chart', () => {
  assert.deepEqual(P.levelInfo(0), { level: 1, into: 0, needed: 50, toNext: 50 });
  assert.equal(P.levelInfo(120).level, 3);
  const week = P.lastDays({ '2026-11-03': 30 }, new Date(2026, 10, 3, 9));
  assert.equal(week.length, 7);
  assert.equal(week[6].xp, 30);
  assert.equal(week[6].isToday, true);
  assert.equal(week[6].label, 'Мя'); // 2026-11-03 is a Tuesday
});

test('profile stats: average uses best score per quiz', () => {
  let s = finishLessons(P.emptyProgress(), unitLessonIds(0));
  s = P.submitQuiz(s, course.units[0].quiz, 2, DAY).state;
  s = P.submitQuiz(s, course.units[0].quiz, 4, DAY).state;
  const stats = P.profileStats(course, s, new Date(2026, 10, 3));
  assert.equal(stats.avgQuizPercent, 80);
  assert.equal(stats.passedQuizzes, 1);
  assert.equal(stats.xp, 50 + 20);
});
