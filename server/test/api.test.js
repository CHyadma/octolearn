import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createApp } from '../src/app.js';
import { DEMO_EMAIL, DEMO_PASSWORD, openDb, seed } from '../src/db.js';
import { getProgress, saveProgress } from '../src/repo.js';
import { loadSeed } from '../src/seed.js';

async function withServer(fn) {
  const db = openDb(':memory:');
  seed(db, loadSeed());
  const server = createApp(db).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    await fn(base, db);
  } finally {
    server.close();
  }
}

const json = (res) => res.json();
const post = (url, body, token) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
const authed = (token, init = {}) => ({
  ...init,
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...init.headers },
});

test('GET course returns the seeded course in app shape', () =>
  withServer(async (base) => {
    const seedData = loadSeed();
    const course = await fetch(`${base}/courses/eng-a1`).then(json);
    const origin = base.replace(/\/api$/, '');
    for (const u of seedData.units) for (const l of u.lessons) if (l.videoUrl.startsWith('/')) l.videoUrl = origin + l.videoUrl;
    assert.deepEqual(course, { course: seedData.course, units: seedData.units });
  }));

test('unknown course → 404', () =>
  withServer(async (base) => {
    assert.equal((await fetch(`${base}/courses/nope`)).status, 404);
  }));

test('lesson videos are served with Range support', () =>
  withServer(async (base) => {
    const course = await fetch(`${base}/courses/eng-a1`).then(json);
    for (const lesson of course.units.flatMap((u) => (u.comingSoon ? [] : u.lessons))) {
      const res = await fetch(lesson.videoUrl, { headers: { range: 'bytes=0-1' } });
      assert.equal(res.status, 206, lesson.videoUrl);
      assert.equal(res.headers.get('content-type'), 'video/mp4');
      await res.arrayBuffer();
    }
  }));

test('register → me → logout invalidates the token', () =>
  withServer(async (base, db) => {
    const res = await post(`${base}/auth/register`, { name: 'Сараа', email: 'Saraa@Example.com', password: 'secret12' });
    assert.equal(res.status, 201);
    const { token, user } = await res.json();
    assert.equal(user.email, 'saraa@example.com');
    assert.equal(user.name, 'Сараа');

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
    assert.match(row.password_hash, /^scrypt\$/);
    assert.ok(!row.password_hash.includes('secret12'));

    assert.deepEqual(await fetch(`${base}/me`, authed(token)).then(json), user);
    assert.equal((await post(`${base}/auth/logout`, {}, token)).status, 204);
    assert.equal((await fetch(`${base}/me`, authed(token))).status, 401);
  }));

test('register validation and duplicate email', () =>
  withServer(async (base) => {
    const bad = await post(`${base}/auth/register`, { name: '', email: 'nope', password: '123' });
    assert.equal(bad.status, 400);
    assert.deepEqual(Object.keys((await bad.json()).fields).sort(), ['email', 'name', 'password']);

    const dup = await post(`${base}/auth/register`, { name: 'X', email: DEMO_EMAIL.toUpperCase(), password: 'secret12' });
    assert.equal(dup.status, 409);
  }));

test('login: demo account works, wrong password and unknown email look the same', () =>
  withServer(async (base) => {
    const ok = await post(`${base}/auth/login`, { email: DEMO_EMAIL, password: DEMO_PASSWORD });
    assert.equal(ok.status, 200);
    assert.ok((await ok.json()).token);

    const wrong = await post(`${base}/auth/login`, { email: DEMO_EMAIL, password: 'nope-nope' });
    const unknown = await post(`${base}/auth/login`, { email: 'x@y.mn', password: 'nope-nope' });
    assert.equal(wrong.status, 401);
    assert.deepEqual(await wrong.json(), await unknown.json());
  }));

test('progress requires auth and is isolated per user; stale writes ignored', () =>
  withServer(async (base) => {
    const url = `${base}/me/progress/eng-a1`;
    assert.equal((await fetch(url)).status, 401);

    const a = (await post(`${base}/auth/register`, { name: 'A', email: 'a@a.mn', password: 'secret12' }).then(json)).token;
    const b = (await post(`${base}/auth/register`, { name: 'B', email: 'b@b.mn', password: 'secret12' }).then(json)).token;
    assert.equal(await fetch(url, authed(a)).then(json), null);

    const body = { completedLessonIds: ['u1-l1'], quizResults: {}, xp: 10, activity: { '2026-11-03': 10 }, updatedAt: 2000 };
    const put = (token, payload) => fetch(url, authed(token, { method: 'PUT', body: JSON.stringify(payload) }));
    assert.deepEqual(await put(a, body).then(json), body);

    const stale = await put(a, { ...body, xp: 0, completedLessonIds: [], updatedAt: 1000 }).then(json);
    assert.equal(stale.xp, 10, 'older write must not overwrite newer progress');
    assert.equal((await put(a, { nope: 1 })).status, 400);

    assert.equal(await fetch(url, authed(b)).then(json), null, "user B must not see A's progress");
  }));

test('re-seeding content keeps learner progress and the demo password', () => {
  const db = openDb(':memory:');
  seed(db, loadSeed());
  saveProgress(db, 'demo', 'eng-a1', { completedLessonIds: ['u1-l1'], quizResults: {}, xp: 10, activity: {}, updatedAt: 1 });
  const before = db.prepare("SELECT password_hash FROM users WHERE id = 'demo'").get().password_hash;
  seed(db, loadSeed());
  assert.equal(getProgress(db, 'demo', 'eng-a1')?.xp, 10);
  assert.equal(db.prepare("SELECT password_hash FROM users WHERE id = 'demo'").get().password_hash, before);
});

test('upgrading a pre-login database gives the demo user credentials', async () => {
  const { default: Database } = await import('better-sqlite3');
  const { mkdtempSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const file = join(mkdtempSync(join(tmpdir(), 'octo-')), 'old.db');
  const old = new Database(file);
  old.exec("CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, avatar_url TEXT); INSERT INTO users VALUES ('demo','Болд',NULL);");
  old.close();
  const db = openDb(file);
  const { authenticate } = await import('../src/repo.js');
  assert.equal(authenticate(db, DEMO_EMAIL, DEMO_PASSWORD)?.id, 'demo');
});
