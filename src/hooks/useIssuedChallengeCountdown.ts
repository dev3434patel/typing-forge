import { useEffect, useState } from 'react';
import type { SessionClock } from '@/lib/typing-core/types';

/** Preparation presentation only. Stops refreshing when the issued window opens. */
export function useIssuedChallengeCountdown(opensAt: number | null, clock: SessionClock | null): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (opensAt === null || !clock) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      if (stopped) return;
      const current = clock.wallNow();
      setNow(current);
      if (current < opensAt) timer = setTimeout(refresh, Math.max(1, Math.min(100, Math.ceil(opensAt - current))));
    };
    refresh();
    return () => { stopped = true; clearTimeout(timer); };
  }, [opensAt, clock]);
  return now;
}
