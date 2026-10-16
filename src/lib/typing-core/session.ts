import type { FinishReason, NormalizedEdit, PauseInterval, SessionClock, SessionConfig, SessionEvent, SessionResult, SessionSnapshot, TargetSegment } from './types.ts';
import { activeOffset, calculateMetrics, replaySession } from './metrics.ts';
import { applyEvent, emptyTranscript, targetGraphemes, normalizeTarget, SEGMENTATION_POLICY, type Attempt } from './transcript.ts';

function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(child => freeze(child));
    Object.freeze(value);
  }
  return value;
}
function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
/** Only named public fixed passages share passage-level comparison cohorts.
 * Custom/private text stays out of persistent keys, including caller-supplied IDs.
 */
export function comparisonContent(config: SessionConfig): { contentId: string | null; sessionId: string | null; eligible: boolean; reason: string | null } {
  if (config.mode === 'custom' || config.privacy === 'private-custom' || config.scoringPolicy === 'free') return { contentId: null, sessionId: config.clientSessionId, eligible: false, reason: 'Unstandardized or private practice content' };
  if (config.mode === 'quote' || config.mode === 'code') {
    const id = config.settings?.contentId;
    if (typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)) return { contentId: id, sessionId: null, eligible: true, reason: null };
    return { contentId: null, sessionId: config.clientSessionId, eligible: false, reason: 'Fixed passage has no stable public content identity' };
  }
  return { contentId: null, sessionId: null, eligible: true, reason: null };
}
export function comparisonKey(config: SessionConfig): string {
  const content = comparisonContent(config);
  return JSON.stringify({ version: 'forge-v3', comparisonPolicy: 'forge-cohorts-v2', contentId: content.contentId, sessionId: content.sessionId, policy: config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose'), mode: config.mode, durationMs: config.durationMs ?? null, words: config.wordCount ?? null, language: config.language ?? 'en', script: config.script ?? 'Latin', layout: config.keyboardLayout ?? 'qwerty', method: config.inputMethod ?? 'keyboard', punctuation: !!config.punctuation, numbers: !!config.numbers, codeLanguage: config.codeLanguage ?? null, corpus: config.contentRevision ?? 'unspecified', generator: config.generatorVersion ?? 'unspecified', segmentation: SEGMENTATION_POLICY, repeated: !!config.repeatedContent, paused: !!config.paused, rejectionPolicy: !!config.rejectIncorrect });
}
/** Monotonic clock and wall clock are injected; the core has no browser or persistence dependency. */
export class SessionController {
  readonly configuration: SessionConfig;
  private state = emptyTranscript();
  private transcriptEvents: SessionEvent[] = [];
  private issued: TargetSegment[] = [];
  private target: string;
  private startMono: number | null = null;
  private wallStart: number | null = null;
  private lastNow: number | null = null;
  private pauseStart: number | null = null;
  private pauses: PauseInterval[] = [];
  private finalized: SessionResult | null = null;
  private clockAnomaly = false;
  private lateTargetExtension = false;

  constructor(config: SessionConfig, private readonly clock: SessionClock) {
    if (!config.clientSessionId || config.clientSessionId.length > 200) throw new Error('Session ID is required');
    if (config.initialTarget.length > 1_000_000) throw new Error('Target exceeds the session resource limit');
    if (config.durationMs !== undefined && (!Number.isFinite(config.durationMs) || config.durationMs <= 0 || config.durationMs > 86_400_000)) throw new Error('Duration must be greater than zero and at most one day');
    if (config.mode === 'time' && !config.durationMs) throw new Error('Timed tests require a duration');
    const policy = config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose');
    this.configuration = freeze(copy({ ...config, scoringPolicy: policy, initialTarget: normalizeTarget(config.initialTarget, policy) }));
    this.target = this.configuration.initialTarget;
    if (config.startImmediately) this.start(this.readNow());
  }
  get status(): SessionSnapshot['status'] { return this.finalized ? 'finished' : this.pauseStart !== null ? 'paused' : this.startMono !== null ? 'running' : 'ready'; }
  get result(): SessionResult | null { return this.finalized; }
  /** Canonical retained input for edit diffing; reading text never samples time or rescores. */
  get currentText(): string { return this.state.units.join(''); }
  /** Read-only view feedback from the actual last edit, without replaying or rescoring. */
  get lastInputAttempts(): readonly Attempt[] {
    const event = this.transcriptEvents.at(-1);
    if (!event?.text) return [];
    let start = this.state.attempts.length;
    while (start > 0 && this.state.attempts[start - 1].eventSequence === event.sequence) start--;
    return this.state.attempts.slice(start).map(attempt => ({ ...attempt }));
  }
  /** Start a server-timed race/challenge at an already reached monotonic instant.
   * The adapter converts the authenticated server start into this clock domain.
   * Calling late preserves the missed time; first input never resets this start.
   */
  startAt(monotonicStart: number, startedAtWall?: number): SessionSnapshot {
    if (this.startMono !== null || this.transcriptEvents.length || this.finalized) throw new Error('Session has already started');
    const now = this.readNow();
    if (!Number.isFinite(monotonicStart) || monotonicStart > now || now - monotonicStart > 86_400_000) throw new Error('Start must be an already reached monotonic instant');
    const wall = startedAtWall ?? this.clock.wallNow() - (now - monotonicStart);
    if (!Number.isFinite(wall)) throw new Error('Wall start must be finite');
    this.startMono = monotonicStart;
    this.wallStart = wall;
    return this.tick(now);
  }
  private readNow(value = this.clock.now()): number {
    if (!Number.isFinite(value)) throw new Error('Clock must return a finite monotonic value');
    if (this.lastNow !== null && value < this.lastNow) { this.clockAnomaly = true; value = this.lastNow; }
    this.lastNow = value;
    return value;
  }
  private readWall(): number {
    const value = this.clock.wallNow();
    if (!Number.isFinite(value)) throw new Error('Wall clock must return a finite value');
    return value;
  }
  private start(now: number): void { this.startMono = now; this.wallStart = this.readWall(); }
  private intervals(now: number): PauseInterval[] {
    return this.pauseStart === null ? this.pauses : [...this.pauses, { startMs: this.pauseStart, endMs: Math.max(this.pauseStart, now - (this.startMono ?? now)) }];
  }
  private elapsed(now: number): number {
    return this.startMono === null ? 0 : activeOffset(Math.max(0, now - this.startMono), this.intervals(now));
  }
  input(edit: NormalizedEdit, at?: number): SessionSnapshot {
    if (this.finalized) return this.finalized;
    const now = this.readNow(at);
    if (this.pauseStart !== null) return this.snapshot(now);
    if (this.startMono !== null && this.configuration.durationMs !== undefined && this.elapsed(now) >= this.configuration.durationMs) return this.finish('timeout', now);
    if (this.transcriptEvents.length >= 100_000) throw new Error('Session event limit exceeded');
    const text = edit.text ?? '';
    if (this.startMono === null && text && edit.type !== 'delete' && edit.type !== 'submit') this.start(now);
    const length = this.state.units.length;
    const start = edit.start ?? (edit.type === 'delete' ? Math.max(0, length - 1) : length);
    const end = edit.end ?? (edit.type === 'delete' ? length : start);
    const event: SessionEvent = { ...edit, text, start, end, sequence: this.transcriptEvents.length, offsetMs: this.startMono === null ? 0 : now - this.startMono, provenance: edit.provenance ?? (edit.type === 'composition' ? 'composition' : 'keyboard') };
    applyEvent(this.state, event, this.target, this.configuration);
    this.transcriptEvents.push(event);
    const snapshot = this.snapshot(now);
    const finite = !['time', 'zen'].includes(this.configuration.mode) && this.configuration.scoringPolicy !== 'free';
    if (finite && targetGraphemes(this.target).length > 0 && snapshot.metrics.progress === 100) return this.finish('completed', now);
    return snapshot;
  }
  tick(at?: number): SessionSnapshot {
    if (this.finalized) return this.finalized;
    const now = this.readNow(at);
    if (this.startMono !== null && this.configuration.durationMs !== undefined && this.elapsed(now) >= this.configuration.durationMs) return this.finish('timeout', now);
    return this.snapshot(now);
  }
  snapshot(at?: number): SessionSnapshot {
    if (this.finalized) return this.finalized;
    const now = this.readNow(at);
    const elapsedMs = this.configuration.durationMs === undefined ? this.elapsed(now) : Math.min(this.elapsed(now), this.configuration.durationMs);
    const calculated = calculateMetrics(this.configuration, this.target, this.state, elapsedMs, { pauseIntervals: this.intervals(now), includeRhythm: false });
    return { status: this.status, finalText: this.state.units.join(''), targetText: this.target, elapsedMs, wallDurationMs: this.startMono === null ? 0 : now - this.startMono, remainingMs: this.configuration.durationMs === undefined ? null : Math.max(0, this.configuration.durationMs - elapsedMs), cursor: calculated.cursor, characters: calculated.characters, metrics: calculated.metrics, events: this.transcriptEvents.map(event => ({ ...event })) };
  }
  appendTarget(segment: string, at?: number): void {
    if (this.finalized) throw new Error('Cannot append to a finalized target');
    if (!['time', 'zen'].includes(this.configuration.mode)) throw new Error('Finite targets are immutable');
    const text = normalizeTarget(segment, this.configuration.scoringPolicy);
    if (!text || this.target.length + text.length > 1_000_000) throw new Error('Invalid appended target segment');
    const now = this.readNow(at);
    if (this.startMono !== null && this.configuration.durationMs !== undefined && this.elapsed(now) >= this.configuration.durationMs) { this.finish('timeout', now); throw new Error('Cannot append after the session deadline'); }
    const oldUnits = targetGraphemes(this.target);
    const combined = targetGraphemes(this.target + text);
    if (!oldUnits.every((unit, index) => combined[index] === unit)) throw new Error('Appended content cannot alter an issued grapheme');
    if (this.state.attempts.some(attempt => attempt.expected === undefined && attempt.position >= oldUnits.length)) this.lateTargetExtension = true;
    this.issued.push({ offsetMs: this.startMono === null ? 0 : now - this.startMono, text, afterSequence: this.transcriptEvents.length - 1 });
    this.target += text;
  }
  pause(at?: number): SessionSnapshot {
    if (this.finalized || this.startMono === null || this.configuration.mode === 'race' || this.configuration.challengeId) return this.snapshot(at);
    const now = this.readNow(at);
    const before = this.tick(now);
    if (before.status === 'finished') return before;
    if (this.pauseStart === null) this.pauseStart = now - this.startMono;
    return this.snapshot(now);
  }
  resume(at?: number): SessionSnapshot {
    const now = this.readNow(at);
    if (this.pauseStart !== null && this.startMono !== null) { this.pauses.push({ startMs: this.pauseStart, endMs: now - this.startMono }); this.pauseStart = null; }
    return this.snapshot(now);
  }
  finish(reason: FinishReason = 'manual', at?: number): SessionResult {
    if (this.finalized) return this.finalized;
    const now = this.readNow(at);
    if (reason === 'timeout' && (this.startMono === null || this.configuration.durationMs === undefined || this.elapsed(now) < this.configuration.durationMs)) throw new Error('A timeout requires reaching the configured active deadline');
    this.finalized = this.buildResult(reason, now, true);
    return this.finalized;
  }
  /** Replayable interim race evidence without finalizing or resetting the live session. */
  checkpoint(at?: number): SessionResult {
    if (this.finalized) return this.finalized;
    return this.buildResult('manual', this.readNow(at), false);
  }
  private buildResult(reason: FinishReason, now: number, final: boolean): SessionResult {
    const finishedAtWall = this.readWall();
    const wallDurationMs = this.startMono === null ? 0 : Math.max(0, now - this.startMono);
    const pauseIntervals = this.intervals(now).map(interval => ({ ...interval }));
    const duration = this.configuration.durationMs;
    const timedOut = duration !== undefined && (reason === 'timeout' || this.elapsed(now) >= duration);
    const elapsedMs = timedOut ? duration : this.elapsed(now);
    const events = this.transcriptEvents.filter(event => !timedOut || activeOffset(event.offsetMs, pauseIntervals) < duration);
    const finiteFinal = final && !['time', 'zen'].includes(this.configuration.mode) && this.configuration.scoringPolicy !== 'free';
    const replayed = replaySession(this.configuration, events, elapsedMs, { targetText: this.target, pauseIntervals, finiteFinal, issuedTargetSegments: this.issued });
    const assistance = [...new Set(events.map(event => event.provenance).filter(value => value !== 'keyboard'))];
    const reasons: string[] = [];
    const contentComparison = comparisonContent(this.configuration);
    if (!contentComparison.eligible) reasons.push(contentComparison.reason!);
    if (pauseIntervals.length) reasons.push('Explicitly paused practice');
    if (this.clockAnomaly) reasons.push('Monotonic clock anomaly');
    if (this.lateTargetExtension) reasons.push('Target extension followed out-of-target attempts');
    if (this.wallStart !== null && finishedAtWall < this.wallStart) reasons.push('Wall clock ordering anomaly');
    if (assistance.some(value => ['paste', 'drop', 'autocorrect', 'generated'].includes(value))) reasons.push('Assisted input');
    if (this.configuration.repeatedContent) reasons.push('Repeated target');
    if (duration !== undefined && elapsedMs < duration) reasons.push('Incomplete timed session');
    if (this.configuration.scoringPolicy === 'free') reasons.push('Free writing practice');
    if (reason === 'manual' && finiteFinal && replayed.metrics.progress < 100) reasons.push('Partial target');
    if (SEGMENTATION_POLICY.includes('fallback')) reasons.push('Grapheme segmentation unavailable');
    const insertionEvents = events.filter(event => event.text && !['delete', 'submit'].includes(event.type));
    const hasComposition = insertionEvents.some(event => event.provenance === 'composition');
    const inputMethod = hasComposition ? 'composition' : this.configuration.inputMethod === 'keyboard-or-composition' ? 'keyboard' : this.configuration.inputMethod ?? 'keyboard';
    const finalizedConfig = { ...copy(this.configuration), paused: pauseIntervals.length > 0, inputMethod };
    return freeze({ ...this.snapshot(now), ...replayed, status: final ? 'finished' : this.status, elapsedMs, wallDurationMs, remainingMs: duration === undefined ? null : Math.max(0, duration - elapsedMs), events: events.map(event => ({ ...event })), schemaVersion: 3, metricsVersion: 'forge-v3', learningVersion: 'forge-learn-v3', clientSessionId: this.configuration.clientSessionId, ownerScope: this.configuration.ownerScope ?? 'guest', configuration: finalizedConfig, comparisonKey: comparisonKey(finalizedConfig), initialTarget: this.configuration.initialTarget, issuedTargetSegments: this.issued.map(segment => ({ ...segment })), finalTranscript: replayed.finalText, startedAtWall: this.wallStart, finishedAtWall, pauseIntervals, finishReason: timedOut ? 'timeout' : reason, assistance, eligibility: { eligible: reasons.length === 0, reasons, verification: 'local-unverified' } });
  }
}
