export interface OpponentLayoutRevision {
  position: number;
  revision: string;
  ownCursor: number;
  targetText: string;
  scoringPolicy: string;
  rtl: boolean;
  composing: boolean;
  sessionKey: string;
  fontSize: number;
}

/** Reuse only an already measured point while correct input changes colors.
 * Errors, edits and unsupported text retain the native layout path. */
export function canReuseOpponentPoint(previous: OpponentLayoutRevision | undefined, next: OpponentLayoutRevision): boolean {
  if (!previous || previous.sessionKey !== next.sessionKey || previous.position !== next.position ||
    previous.fontSize !== next.fontSize || previous.targetText !== next.targetText ||
    previous.scoringPolicy !== next.scoringPolicy || previous.rtl !== next.rtl ||
    previous.composing !== next.composing || next.composing || next.rtl || next.scoringPolicy !== "prose" ||
    !Number.isInteger(next.position) || next.position < 0 ||
    !Number.isFinite(next.fontSize) || next.fontSize <= 0 ||
    !/^[\x20-\x7e]+$/.test(next.targetText)) return false;
  const prefix = (value: OpponentLayoutRevision) =>
    value.ownCursor === value.revision.length && value.targetText.startsWith(value.revision);
  return prefix(previous) && prefix(next) && (
    next.revision === previous.revision ||
    (next.revision.length === previous.revision.length + 1 && next.revision.startsWith(previous.revision))
  );
}
