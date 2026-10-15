/** Presentation-only opponent pacing; this never changes race scoring or input. */
export interface RacePace {
  position: number;
  label: string;
  wpm: number | null;
  approximate?: boolean;
}

/**
 * Callers supply the number of canonical target graphemes, not UTF-16 length.
 * A bot's exact cursor takes precedence. Human progress is an approximate
 * position based on server-confirmed correct-character coverage.
 */
export function opponentPacePosition(
  targetUnits: number,
  value: { cursor?: number; progress?: number },
): number {
  const length = Number.isFinite(targetUnits)
    ? Math.max(0, Math.floor(targetUnits))
    : 0;
  if (!length) return 0;

  if (typeof value.cursor === "number" && Number.isFinite(value.cursor)) {
    return Math.max(0, Math.min(length, Math.floor(value.cursor)));
  }

  const progress =
    typeof value.progress === "number" && Number.isFinite(value.progress)
      ? Math.max(0, Math.min(100, value.progress))
      : 0;
  return Math.round((length * progress) / 100);
}
