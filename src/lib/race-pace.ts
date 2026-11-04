/** Presentation-only opponent pacing; this never changes race scoring or input. */
export interface RacePace {
  position: number;
  label: string;
  wpm: number | null;
  approximate?: boolean;
}

interface RaceProgressDisplay {
  readonly progress: number;
  readonly wpm: number | null;
  readonly cursor?: number;
}

const trackWpm = (value: number | null) => value === null ? "—" : value.toFixed(0);
const legendWpm = (value: number | null) => value === null || !Number.isFinite(value) ? "—" : String(Math.round(value));

/** Presentation equality only. Keep the original metric values in the state
 * that is published; canonical evidence always comes from the controller.
 */
export function sameRaceProgressDisplay(previous: RaceProgressDisplay, next: RaceProgressDisplay): boolean {
  if (previous.progress !== next.progress || previous.cursor !== next.cursor) return false;
  return trackWpm(previous.wpm) === trackWpm(next.wpm) && legendWpm(previous.wpm) === legendWpm(next.wpm);
}

/** Match filter(expected !== null).length without allocating its temporary
 * array. Present-index checks retain sparse and inherited-slot semantics.
 */
export function raceTargetSlotCount(slots: readonly { readonly expected: string | null }[]): number {
  let count = 0;
  const length = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(slots.length)));
  for (let index = 0; index < length; index++) {
    if (index in slots && slots[index].expected !== null) count++;
  }
  return count;
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
