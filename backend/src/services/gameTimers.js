// Simple in-memory timers. Reset on process restart.
const timeouts = new Map(); // gameId -> { qTimer: Timeout }

export function clearGameTimers(gameId) {
  const key = String(gameId);
  const t = timeouts.get(key);
  if (t?.qTimer) clearTimeout(t.qTimer);
  timeouts.delete(key);
}

export function scheduleQuestionTimeout(gameId, ms, onTimeout) {
  clearGameTimers(gameId);
  const qTimer = setTimeout(() => {
    Promise.resolve(onTimeout()).catch(() => {});
  }, ms);
  timeouts.set(String(gameId), { qTimer });
}