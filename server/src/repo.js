import { randomUUID } from 'node:crypto';

import { hashPassword, verifyPassword } from './auth.js';

/** Read/write queries. Rows are mapped to the JSON shape the app expects. */

export function getCourse(db, courseId) {
  const course = db.prepare('SELECT id, title FROM courses WHERE id = ?').get(courseId);
  if (!course) return null;

  const units = db.prepare('SELECT * FROM units WHERE course_id = ? ORDER BY position').all(courseId);
  const lessons = db
    .prepare(
      `SELECT l.* FROM lessons l JOIN units u ON u.id = l.unit_id
       WHERE u.course_id = ? ORDER BY l.position`,
    )
    .all(courseId);
  const quizzes = db
    .prepare('SELECT q.* FROM quizzes q JOIN units u ON u.id = q.unit_id WHERE u.course_id = ?')
    .all(courseId);
  const questions = db
    .prepare(
      `SELECT qs.* FROM questions qs JOIN quizzes q ON q.id = qs.quiz_id JOIN units u ON u.id = q.unit_id
       WHERE u.course_id = ? ORDER BY qs.position`,
    )
    .all(courseId);

  return {
    course,
    units: units.map((u) => {
      const quiz = quizzes.find((q) => q.unit_id === u.id);
      return {
        id: u.id,
        title: u.title,
        description: u.description,
        color: u.color,
        ...(u.coming_soon ? { comingSoon: true } : {}),
        lessons: lessons
          .filter((l) => l.unit_id === u.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            videoUrl: l.video_url,
            durationSec: l.duration_sec,
          })),
        quiz: {
          id: quiz?.id ?? `${u.id}-quiz`,
          title: quiz?.title ?? '',
          passPercent: quiz?.pass_percent ?? 60,
          questions: questions
            .filter((q) => q.quiz_id === quiz?.id)
            .map((q) => ({
              id: q.id,
              text: q.text,
              options: JSON.parse(q.options_json),
              answerIndex: q.answer_index,
            })),
        },
      };
    }),
  };
}

const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, avatarUrl: u.avatar_url } : null);

export function getUser(db, userId) {
  return publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
}

/** Returns the new user, or null if the email is already taken. */
export function createUser(db, { name, email, password }) {
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?,?,?,?,?)').run(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      hashPassword(password),
      Date.now(),
    );
  } catch (e) {
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) return null;
    throw e;
  }
  return getUser(db, id);
}

export function authenticate(db, email, password) {
  const u = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(String(email ?? '').trim());
  return u && verifyPassword(String(password ?? ''), u.password_hash) ? publicUser(u) : null;
}

export function getProgress(db, userId, courseId) {
  const row = db
    .prepare('SELECT data_json, updated_at FROM progress WHERE user_id = ? AND course_id = ?')
    .get(userId, courseId);
  return row ? { ...JSON.parse(row.data_json), updatedAt: row.updated_at } : null;
}

/**
 * Last-write-wins upsert. A write older than what is stored is ignored and the
 * stored (newer) document is returned so the client can adopt it.
 */
export function saveProgress(db, userId, courseId, progress) {
  const { updatedAt, ...data } = progress;
  const ts = Number.isFinite(updatedAt) ? updatedAt : Date.now();
  db.prepare(
    `INSERT INTO progress (user_id, course_id, data_json, updated_at) VALUES (?,?,?,?)
     ON CONFLICT(user_id, course_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
     WHERE excluded.updated_at >= progress.updated_at`,
  ).run(userId, courseId, JSON.stringify(data), ts);
  return getProgress(db, userId, courseId);
}
