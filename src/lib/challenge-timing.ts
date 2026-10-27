import { SessionController, type NormalizedEdit, type SessionClock, type SessionConfig } from './typing-core';

export const FIRST_INPUT_TIMING = 'first-input-v1';
export const CHALLENGE_RECEIPT_GRACE_MS = 3000;
export interface IssuedChallengeTiming {
  configuration: Partial<SessionConfig>;
  starts_at: string;
  deadline_at: string;
  expires_at: string;
}

/** Midpoint calibration is captured once on receipt, never from later Date.now(). */
export function challengeResponseClock(serverNow: string, beforeMono: number, afterMono: number, now: () => number = () => performance.now()): SessionClock {
  const server = Date.parse(serverNow);
  if (![server, beforeMono, afterMono].every(Number.isFinite) || afterMono < beforeMono) throw new Error('The challenge clock calibration is invalid');
  const midpoint = (beforeMono + afterMono) / 2;
  return { now, wallNow: () => server + now() - midpoint };
}

/** Only the server-issued version selects a policy; legacy attempts keep their start. */
export function challengeUsesFirstInput(configuration: Partial<SessionConfig>): boolean {
  const marker = configuration.settings?.timingPolicy;
  const revision = configuration.contentRevision;
  const firstRevision = revision === 'forge-ranked-en-v2' || revision === 'forge-social-duel-en-v2';
  if (!Object.prototype.hasOwnProperty.call(configuration.settings ?? {}, 'timingPolicy')) {
    if (firstRevision) throw new Error('The issued timing revision is missing its policy');
    return false;
  }
  if (marker !== FIRST_INPUT_TIMING || !firstRevision) throw new Error('Unknown issued challenge timing policy');
  return true;
}

export function issuedChallengeWindow(challenge: IssuedChallengeTiming) {
  const firstInput = challengeUsesFirstInput(challenge.configuration);
  const start = Date.parse(challenge.starts_at), deadline = Date.parse(challenge.deadline_at), expires = Date.parse(challenge.expires_at);
  const duration = challenge.configuration.durationMs;
  if (![start, deadline, expires].every(Number.isFinite) || !Number.isFinite(duration) || !duration || duration <= 0 || deadline - start !== duration || expires < deadline)
    throw new Error('The issued challenge has an invalid preparation window');
  return { firstInput, start, deadline, expires, duration, latestStart: firstInput ? expires - duration : start };
}

class FirstInputChallengeController extends SessionController {
  constructor(configuration: SessionConfig, private readonly issuedClock: SessionClock, private readonly opens: number, private readonly latestStart: number) {
    super(configuration, issuedClock);
  }
  override input(edit: NormalizedEdit, at?: number) {
    const now = at ?? this.issuedClock.now();
    if (this.status === 'ready') {
      const wall = this.issuedClock.wallNow();
      // Navigation/deletion/empty submission cannot create evidence before the
      // first inserted character. Wrong characters still start immediately.
      if (!edit.text || edit.type === 'delete' || edit.type === 'submit' || wall < this.opens || wall > this.latestStart)
        return this.snapshot(now);
    }
    return super.input(edit, now);
  }
}

export function createIssuedChallengeController(configuration: SessionConfig, challenge: IssuedChallengeTiming, serverOffsetMs: number, sourceClock: SessionClock = { now: () => performance.now(), wallNow: () => Date.now() }) {
  const window = issuedChallengeWindow(challenge);
  const mono = sourceClock.now(), wall = sourceClock.wallNow() + serverOffsetMs;
  if (![mono, wall].every(Number.isFinite) || wall < window.start) throw new Error('The issued preparation countdown has not finished');
  if (window.firstInput && wall > window.latestStart) throw new Error('This preparation window has expired. Request a new challenge.');
  // One synchronized anchor keeps later device clock changes out of the run.
  const clock = { now: () => sourceClock.now(), wallNow: () => wall + sourceClock.now() - mono };
  const controller = window.firstInput
    ? new FirstInputChallengeController(configuration, clock, window.start, window.latestStart)
    : new SessionController(configuration, clock);
  if (!window.firstInput) controller.startAt(mono - Math.max(0, wall - window.start), window.start);
  return { controller, preparationRemainingMs: window.firstInput ? window.latestStart - wall : null };
}
