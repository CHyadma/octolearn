import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** scrypt with a per-user random salt, stored as "scrypt$<salt>$<hash>". */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored ?? '').split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

/** Opaque bearer token; only its SHA-256 is stored, so a leaked DB can't be replayed. */
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

export function createSession(db, userId) {
  const token = newToken();
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)').run(
    tokenHash(token),
    userId,
    now,
    now + SESSION_TTL_MS,
  );
  return token;
}

export function userForToken(db, token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.avatar_url FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash(token), Date.now());
  return row ? { id: row.id, name: row.name, email: row.email, avatarUrl: row.avatar_url } : null;
}

export function deleteSession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
}

/** Express middleware: requires `Authorization: Bearer <token>`, sets req.user. */
export const requireAuth = (db) => (req, res, next) => {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') ?? '');
  const user = m && userForToken(db, m[1]);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  req.token = m[1];
  next();
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration({ name, email, password } = {}) {
  const errors = {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 40) errors.name = 'invalid_name';
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) errors.email = 'invalid_email';
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) errors.password = 'weak_password';
  return errors;
}
