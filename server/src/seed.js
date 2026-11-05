import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getMeta, openDb, seed, setMeta } from './db.js';

export const SEED_FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../seed/course.json');
export const loadSeed = () => JSON.parse(readFileSync(SEED_FILE, 'utf8'));

/**
 * Load seed/course.json into the DB when the file changed since the last load
 * (tracked by hash). Learner progress is kept. Returns true if content was reloaded.
 */
export function syncSeed(db, { force = false, resetProgress = false } = {}) {
  const raw = readFileSync(SEED_FILE, 'utf8');
  const hash = createHash('sha1').update(raw).digest('hex');
  if (!force && getMeta(db, 'seed_hash') === hash) return false;
  seed(db, JSON.parse(raw), { resetProgress });
  setMeta(db, 'seed_hash', hash);
  return true;
}

// `npm run seed` — reload content from seed/course.json and clear progress.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDb();
  syncSeed(db, { force: true, resetProgress: process.argv.includes('--reset') });
  console.log('Seeded', db.name);
}
