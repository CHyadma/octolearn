import type { CourseData, ProgressState } from '../domain/types';
import { API_URL } from './config';

export type RemoteProgress = ProgressState & { updatedAt: number };

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export class ApiError extends Error {
  constructor(
    /** Server error code (e.g. "invalid_credentials"), or "network" / "timeout". */
    readonly code: string,
    readonly status?: number,
    readonly fields?: Record<string, string>,
  ) {
    super(code);
  }
}

// The auth store registers these, so this module stays free of store imports.
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};
export function configureAuth(opts: { getToken: () => string | null; onUnauthorized: () => void }) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(controller.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(body?.error ?? `http_${res.status}`, res.status, body?.fields);
  }
  return body as T;
}

const send = (body: unknown, method = 'POST') => ({ method, body: JSON.stringify(body) });

export const api = {
  course: (courseId: string) => request<Omit<CourseData, 'user'>>(`/courses/${courseId}`),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', send({ name, email, password })),
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', send({ email, password })),
  logout: () => request<void>('/auth/logout', send({})),
  me: () => request<User>('/me'),

  getProgress: (courseId: string) => request<RemoteProgress | null>(`/me/progress/${courseId}`),
  saveProgress: (courseId: string, p: RemoteProgress) =>
    request<RemoteProgress>(`/me/progress/${courseId}`, send(p, 'PUT')),
};
