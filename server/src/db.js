import Database from 'better-sqlite3';

import { hashPassword } from './auth.js';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DB_PATH = process.env.DB_PATH ?? resolve(here, '../data/octolearn.db');

export const DEMO_EMAIL = 'demo@octolearn.online';
export const DEMO_PASSWORD = 'demo1234';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS courses (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS units (
  id          TEXT PRIMARY KEY,
  course_id   TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#58CC02',
  coming_soon INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lessons (
  id           TEXT PRIMARY KEY,
  unit_id      TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  video_url    TEXT NOT NULL DEFAULT '',
  duration_sec INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quizzes (
  id           TEXT PRIMARY KEY,
  unit_id      TEXT NOT NULL UNIQUE REFERENCES units(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  pass_percent INTEGER NOT NULL DEFAULT 60
);
CREATE TABLE IF NOT EXISTS questions (
  id           TEXT NOT NULL,
  quiz_id      TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL,
  text         TEXT NOT NULL,
  options_json TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  PRIMARY KEY (quiz_id, id)
);
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  avatar_url TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
-- Progress is stored as one JSON document per user/course: the app owns its
-- shape (completed lessons, quiz results, xp, activity) and the server only
-- needs last-write-wins by updated_at.
CREATE TABLE IF NOT EXISTS progress (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  data_json  TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_units_course ON units(course_id, position);
CREATE INDEX IF NOT EXISTS idx_lessons_unit ON lessons(unit_id, position);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id, position);
`;

export function openDb(path = DEFAULT_DB_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  migrate(db);
  ensureDemoCredentials(db);
  return db;
}

/** Additive migrations for databases created by older versions. */
function migrate(db) {
  const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
  if (!cols.includes('email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT');
  if (!cols.includes('password_hash')) db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
  if (!cols.includes('created_at')) db.exec('ALTER TABLE users ADD COLUMN created_at INTEGER');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE)');
}

/** Databases created before login existed have a demo user without credentials. */
function ensureDemoCredentials(db) {
  db.prepare("UPDATE users SET email = ?, password_hash = ? WHERE id = 'demo' AND password_hash IS NULL").run(
    DEMO_EMAIL,
    hashPassword(DEMO_PASSWORD),
  );
}

/** Wipe content tables and load a course JSON (same shape the app uses). */
export function seed(db, data, { resetProgress = false } = {}) {
  const tx = db.transaction(() => {
    if (resetProgress) db.exec('DELETE FROM progress;');
    db.exec('DELETE FROM questions; DELETE FROM quizzes; DELETE FROM lessons; DELETE FROM units;');
    // UPSERT, not INSERT OR REPLACE: REPLACE deletes the row first and would cascade-delete progress.
    db.prepare('INSERT INTO courses (id, title) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title').run(data.course.id, data.course.title);
    const unit = db.prepare(
      'INSERT INTO units (id, course_id, position, title, description, color, coming_soon) VALUES (?,?,?,?,?,?,?)',
    );
    const lesson = db.prepare(
      'INSERT INTO lessons (id, unit_id, position, title, description, video_url, duration_sec) VALUES (?,?,?,?,?,?,?)',
    );
    const quiz = db.prepare('INSERT INTO quizzes (id, unit_id, title, pass_percent) VALUES (?,?,?,?)');
    const question = db.prepare(
      'INSERT INTO questions (id, quiz_id, position, text, options_json, answer_index) VALUES (?,?,?,?,?,?)',
    );
    data.units.forEach((u, ui) => {
      unit.run(u.id, data.course.id, ui, u.title, u.description ?? '', u.color ?? '#58CC02', u.comingSoon ? 1 : 0);
      u.lessons.forEach((l, li) =>
        lesson.run(l.id, u.id, li, l.title, l.description ?? '', l.videoUrl ?? '', l.durationSec ?? 0),
      );
      quiz.run(u.quiz.id, u.id, u.quiz.title, u.quiz.passPercent ?? 60);
      u.quiz.questions.forEach((q, qi) =>
        question.run(q.id, u.quiz.id, qi, q.text, JSON.stringify(q.options), q.answerIndex),
      );
    });
    // Demo account so reviewers can log in straight away (an existing password is kept).
    db.prepare(
      `INSERT INTO users (id, name, avatar_url, email, password_hash, created_at) VALUES (?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar_url = excluded.avatar_url,
         email = COALESCE(users.email, excluded.email), password_hash = COALESCE(users.password_hash, excluded.password_hash)`,
    ).run('demo', data.user.name, data.user.avatarUrl, DEMO_EMAIL, hashPassword(DEMO_PASSWORD), Date.now());
  });
  tx();
}

export function getMeta(db, key) {
  return db.prepare('SELECT value FROM meta WHERE key = ?').get(key)?.value ?? null;
}

export function setMeta(db, key, value) {
  db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run(key, value);
}

export function isEmpty(db) {
  return db.prepare('SELECT COUNT(*) AS n FROM units').get().n === 0;
}
