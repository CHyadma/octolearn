import { api } from '../api/client';
import { COURSE_ID } from './courseStore';
import { snapshot, useProgress, type StoredProgress } from './progressStore';

/**
 * Progress sync with the server, last-write-wins on `updatedAt`.
 * Local AsyncStorage stays the source the UI reads from, so the app keeps
 * working offline; the server copy lets progress survive reinstalls/devices.
 */
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let adopting = false;

function adoptIfNewer(remote: StoredProgress | null) {
  if (remote && remote.updatedAt > useProgress.getState().updatedAt) {
    adopting = true;
    useProgress.getState().adopt(remote);
    adopting = false;
    return true;
  }
  return false;
}

async function push() {
  const local = snapshot();
  if (!local.updatedAt) return;
  try {
    adoptIfNewer(await api.saveProgress(COURSE_ID, local));
  } catch (e) {
    console.warn('[sync] push failed, will retry on next change', e);
  }
}

/** Pull once on start, then push every local change (debounced). Returns an unsubscribe fn. */
export function startProgressSync() {
  (async () => {
    try {
      const remote = await api.getProgress(COURSE_ID);
      if (!adoptIfNewer(remote)) await push();
    } catch (e) {
      console.warn('[sync] initial pull failed', e);
    }
  })();

  const unsubscribe = useProgress.subscribe((state, prev) => {
    if (adopting || state.updatedAt === prev.updatedAt) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 400);
  });
  return () => {
    unsubscribe();
    if (pushTimer) clearTimeout(pushTimer);
  };
}
