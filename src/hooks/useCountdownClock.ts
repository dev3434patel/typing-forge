import { useLayoutEffect, useState } from "react";
import { watchCountdown } from "@/lib/countdown-clock";

/** Refresh while a countdown is pending; idle, active and result views do not poll. */
export function useCountdownClock(deadlineMs: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useLayoutEffect(() => watchCountdown(deadlineMs, setNow), [deadlineMs]);
  return now;
}
