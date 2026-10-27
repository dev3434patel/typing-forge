/** Presentation refresh only. SessionController and the server own elapsed time. */
export const COUNTDOWN_REFRESH_MS = 100;

export function watchCountdown(
  deadlineMs: number | null,
  onTick: (nowMs: number) => void,
): () => void {
  if (deadlineMs === null || !Number.isFinite(deadlineMs))
    return () => undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    if (stopped) return;
    const now = Date.now();
    onTick(now);
    const remaining = deadlineMs - now;
    if (!stopped && remaining > 0)
      timer = setTimeout(
        refresh,
        Math.max(1, Math.min(COUNTDOWN_REFRESH_MS, Math.ceil(remaining))),
      );
  };
  refresh();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
