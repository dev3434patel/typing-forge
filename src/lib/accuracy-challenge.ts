/** A small local practice goal. Typing metrics and race progress remain independent. */
export const ACCURACY_CHALLENGE_GOAL = 25;

export interface AccuracyChallengeState {
  sessionId: string;
  lastSequence: number;
  current: number;
  best: number;
  completed: boolean;
}

export interface AccuracyChallengeAttempt {
  correct: boolean;
  eventSequence: number;
}

export function createAccuracyChallenge(
  sessionId: string,
): AccuracyChallengeState {
  return { sessionId, lastSequence: -1, current: 0, best: 0, completed: false };
}

/** Consume only the newest canonical edit's grapheme attempts, once.
 * Empty batches (deletions/submissions) preserve the chain. A corrected error
 * remains an error in the attempt stream; deleting it cannot restore a chain.
 */
export function advanceAccuracyChallenge(
  previous: AccuracyChallengeState,
  sessionId: string,
  sequence: number | null | undefined,
  attempts: readonly AccuracyChallengeAttempt[],
): AccuracyChallengeState {
  const state =
    previous.sessionId === sessionId
      ? previous
      : createAccuracyChallenge(sessionId);
  if (
    !Number.isSafeInteger(sequence) ||
    sequence === null ||
    sequence === undefined ||
    sequence < 0 ||
    sequence <= state.lastSequence
  )
    return state;

  let { current, best, completed } = state;
  for (const attempt of attempts) {
    // A stale last-input batch cannot be attributed to a newer empty edit.
    if (attempt.eventSequence !== sequence) continue;
    current = attempt.correct
      ? Math.min(ACCURACY_CHALLENGE_GOAL, current + 1)
      : 0;
    best = Math.max(best, current);
    completed ||= current === ACCURACY_CHALLENGE_GOAL;
  }
  return { sessionId, lastSequence: sequence, current, best, completed };
}
