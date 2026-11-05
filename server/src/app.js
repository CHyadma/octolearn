import cors from 'cors';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createSession, deleteSession, requireAuth, validateRegistration } from './auth.js';
import { authenticate, createUser, getCourse, getProgress, saveProgress } from './repo.js';

const PUBLIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public');

/** Video paths stored relative (e.g. /videos/u1-l1.mp4) are served by this API; make them absolute for the client. */
function absolutize(course, origin) {
  for (const unit of course.units) {
    for (const lesson of unit.lessons) {
      if (lesson.videoUrl.startsWith('/')) lesson.videoUrl = origin + lesson.videoUrl;
    }
  }
  return course;
}

const isProgress = (b) =>
  b &&
  Array.isArray(b.completedLessonIds) &&
  b.completedLessonIds.every((x) => typeof x === 'string') &&
  typeof b.quizResults === 'object' &&
  b.quizResults !== null &&
  Number.isFinite(b.xp) &&
  b.xp >= 0 &&
  typeof b.activity === 'object' &&
  b.activity !== null;

export function createApp(db) {
  const app = express();
  // Behind a tunnel or hosting proxy (https), build video URLs with the public scheme/host.
  app.set('trust proxy', true);
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  // Lesson videos (supports HTTP Range requests, which iOS AVPlayer requires).
  app.use('/videos', express.static(resolve(PUBLIC_DIR, 'videos'), { maxAge: '1d' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/courses/:courseId', (req, res) => {
    const course = getCourse(db, req.params.courseId);
    if (!course) return res.status(404).json({ error: 'course_not_found' });
    res.json(absolutize(course, `${req.protocol}://${req.get('host')}`));
  });

  // ---- auth ----
  app.post('/api/auth/register', (req, res) => {
    const errors = validateRegistration(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'validation', fields: errors });
    const user = createUser(db, req.body);
    if (!user) return res.status(409).json({ error: 'email_taken' });
    res.status(201).json({ token: createSession(db, user.id), user });
  });

  app.post('/api/auth/login', (req, res) => {
    const user = authenticate(db, req.body?.email, req.body?.password);
    // Same answer for unknown email and wrong password, so accounts can't be enumerated.
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });
    res.json({ token: createSession(db, user.id), user });
  });

  const auth = requireAuth(db);

  app.post('/api/auth/logout', auth, (req, res) => {
    deleteSession(db, req.token);
    res.status(204).end();
  });

  app.get('/api/me', auth, (req, res) => res.json(req.user));

  // ---- progress: always the logged-in user's own ----
  app.get('/api/me/progress/:courseId', auth, (req, res) => {
    res.json(getProgress(db, req.user.id, req.params.courseId));
  });

  app.put('/api/me/progress/:courseId', auth, (req, res) => {
    const { courseId } = req.params;
    if (!getCourse(db, courseId)) return res.status(404).json({ error: 'course_not_found' });
    if (!isProgress(req.body)) return res.status(400).json({ error: 'invalid_progress' });
    res.json(saveProgress(db, req.user.id, courseId, req.body));
  });

  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
  return app;
}
