import type { PauseInterval, SessionConfig, SessionEvent, SessionMetricValues, TargetSegment, TimeSample } from './types.ts';
import { alignTranscript, applyEvent, emptyTranscript, targetGraphemes, normalizeTarget, segmentPrecedesEvent, type TranscriptState, type WordCreditTrace } from './transcript.ts';

export function activeOffset(offsetMs: number, pauses: PauseInterval[] = []): number {
  if (!Number.isFinite(offsetMs) || offsetMs < 0) throw new Error('Event time must be finite and non-negative');
  let paused = 0;
  for (const pause of pauses) paused += Math.max(0, Math.min(offsetMs, pause.endMs) - pause.startMs);
  return Math.max(0, offsetMs - paused);
}
export function rate(units: number, elapsedMs: number): number | null {
  if (elapsedMs <= 0 || !Number.isFinite(elapsedMs) || !Number.isFinite(units)) return null;
  const value = Math.max(0, units) * 12000 / elapsedMs;
  return Number.isFinite(value) ? value : null;
}
function rhythm(attempts: Array<{ offsetMs: number }>, elapsedMs: number): { consistency: number | null; peakFiveSecondWpm: number | null } {
  if (elapsedMs < 5000) return { consistency: null, peakFiveSecondWpm: null };
  const counts = new Array<number>(Math.ceil(elapsedMs / 1000)).fill(0);
  for (const attempt of attempts) counts[Math.min(counts.length - 1, Math.floor(attempt.offsetMs / 1000))]++;
  const buckets: Array<{ duration: number; value: number }> = [];
  for (let start = 0; start < elapsedMs; start += 1000) {
    const end = Math.min(elapsedMs, start + 1000);
    const count = counts[start / 1000];
    buckets.push({ duration: end - start, value: rate(count, end - start) ?? 0 });
  }
  const mean = buckets.reduce((sum, bucket) => sum + bucket.value * bucket.duration, 0) / elapsedMs;
  const variance = buckets.reduce((sum, bucket) => sum + (bucket.value - mean) ** 2 * bucket.duration, 0) / elapsedMs;
  const consistency = attempts.length < 5 || mean === 0 ? null : Math.max(0, Math.min(100, 100 * (1 - Math.sqrt(variance) / mean)));
  const endings: number[] = [];
  for (let end = 5000; end <= elapsedMs; end += 1000) endings.push(end);
  if (endings[endings.length - 1] !== elapsedMs) endings.push(elapsedMs);
  let peakFiveSecondWpm = 0;
  let left = 0;
  let right = 0;
  for (const end of endings) {
    while (left < attempts.length && attempts[left].offsetMs < end - 5000) left++;
    while (right < attempts.length && (attempts[right].offsetMs < end || (end === elapsedMs && attempts[right].offsetMs === end))) right++;
    const count = right - left;
    peakFiveSecondWpm = Math.max(peakFiveSecondWpm, rate(count, 5000) ?? 0);
  }
  return { consistency, peakFiveSecondWpm };
}
export function calculateMetrics(
  config: SessionConfig, targetText: string, state: TranscriptState, elapsedMs: number,
  options: { finiteFinal?: boolean; pauseIntervals?: PauseInterval[]; includeRhythm?: boolean } = {},
): { metrics: SessionMetricValues; characters: ReturnType<typeof alignTranscript>['characters']; cursor: number } {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 86_400_000) throw new Error('Elapsed duration must be finite and within one day');
  const policy = config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose');
  const aligned = alignTranscript(targetGraphemes(targetText), state.units, policy, options.finiteFinal, state.submissions);
  const count = (status: string) => aligned.characters.filter(char => char.status === status).length;
  const correct = policy === 'free' ? 0 : count('correct');
  const incorrect = policy === 'free' ? 0 : count('incorrect');
  const extra = policy === 'free' ? state.units.length : count('extra');
  const missed = policy === 'free' ? 0 : count('missed');
  const correctAttempts = state.correctAttemptCount;
  const incorrectAttempts = state.attempts.length - correctAttempts;
  const attempts = options.includeRhythm === false ? [] : state.attempts.map(attempt => ({ ...attempt, offsetMs: activeOffset(attempt.offsetMs, options.pauseIntervals) }));
  const totalFinal = correct + incorrect + extra + missed;
  const metrics: SessionMetricValues = {
    wpm: policy === 'free' ? null : rate(aligned.creditedUnits, elapsedMs),
    rawWpm: rate(state.units.length, elapsedMs),
    attemptRate: rate(state.attempts.length, elapsedMs),
    correctCharacterWpm: policy === 'free' ? null : rate(correct, elapsedMs),
    inputAccuracy: policy === 'free' || !state.attempts.length ? null : correctAttempts / state.attempts.length * 100,
    finalTextAccuracy: policy === 'free' || !totalFinal ? null : correct / totalFinal * 100,
    ...(options.includeRhythm === false ? { consistency: null, peakFiveSecondWpm: null } : rhythm(attempts, elapsedMs)),
    correct, incorrect, extra, missed, untyped: policy === 'free' ? 0 : count('untyped'),
    creditedUnits: policy === 'free' ? 0 : aligned.creditedUnits,
    retainedUnits: state.units.length,
    correctAttempts, incorrectAttempts, insertionAttempts: state.attempts.length,
    deletionActions: state.deletionActions, deletedUnits: state.deletedUnits,
    progress: targetText.length && policy !== 'free' ? Math.min(100, aligned.processed / targetGraphemes(targetText).length * 100) : 0,
    elapsedMs,
  };
  return { metrics, characters: aligned.characters, cursor: aligned.cursor };
}

export interface ReplayOptions { targetText?: string; pauseIntervals?: PauseInterval[]; finiteFinal?: boolean; issuedTargetSegments?: TargetSegment[] }
function prepareReplay(config: SessionConfig, events: SessionEvent[], elapsedMs: number, options: ReplayOptions) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 86_400_000) throw new Error('Elapsed duration must be finite and within one day');
  const initialTarget = normalizeTarget(config.initialTarget, config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose'));
  const segments = options.issuedTargetSegments;
  const reconstructed = initialTarget + (segments?.map(segment => segment.text).join('') ?? '');
  const targetText = options.targetText ?? reconstructed;
  let lastIssueOffset = -1;
  let lastIssueSequence = -1;
  for (const segment of segments ?? []) {
    if (!Number.isFinite(segment.offsetMs) || segment.offsetMs < 0 || segment.offsetMs < lastIssueOffset || typeof segment.text !== 'string' || (segment.afterSequence !== undefined && (!Number.isInteger(segment.afterSequence) || segment.afterSequence < -1)) || (segment.offsetMs === lastIssueOffset && (segment.afterSequence ?? -1) < lastIssueSequence)) throw new Error('Target issuance must have finite ordered offsets and event sequences');
    lastIssueOffset = segment.offsetMs;
    lastIssueSequence = segment.afterSequence ?? -1;
  }
  if (segments && reconstructed !== targetText) throw new Error('Issued target does not reconstruct the final target');
  const pauses = options.pauseIntervals ?? [];
  let pauseEnd = 0;
  for (const pause of pauses) {
    if (!Number.isFinite(pause.startMs) || !Number.isFinite(pause.endMs) || pause.startMs < pauseEnd || pause.endMs < pause.startMs) throw new Error('Pause intervals must be finite, ordered and non-overlapping');
    pauseEnd = pause.endMs;
  }
  const state = emptyTranscript();
  const accepted: Array<{ event: SessionEvent; targetText: string }> = [];
  if (events.length > 100_000) throw new Error('Session event limit exceeded');
  let previousSequence = -1;
  let previousOffset = 0;
  let issuedTarget = segments ? initialTarget : targetText;
  let segmentIndex = 0;
  for (const event of events) {
    if (!Number.isInteger(event.sequence) || event.sequence <= previousSequence) throw new Error('Event sequence must increase');
    if (!Number.isFinite(event.offsetMs) || event.offsetMs < previousOffset) throw new Error('Event time must be finite and monotonic');
    previousSequence = event.sequence;
    previousOffset = event.offsetMs;
    const active = activeOffset(event.offsetMs, pauses);
    if (active > elapsedMs || (config.durationMs !== undefined && active >= config.durationMs)) continue;
    if (pauses.some(pause => event.offsetMs >= pause.startMs && event.offsetMs < pause.endMs)) throw new Error('Scored event occurred during a pause');
    while (segments && segmentIndex < segments.length && segmentPrecedesEvent(segments[segmentIndex], event)) issuedTarget += segments[segmentIndex++].text;
    applyEvent(state, event, issuedTarget, config);
    accepted.push({ event, targetText: issuedTarget });
  }
  return { state, accepted, targetText, initialTarget, segments, pauses };
}
/** Word diagnostics share the exact replay preparation and aggregate credit loop. */
export function traceSessionWords(config: SessionConfig, events: SessionEvent[], elapsedMs: number, options: ReplayOptions = {}): WordCreditTrace[] {
  const { state, targetText } = prepareReplay(config, events, elapsedMs, options);
  return alignTranscript(targetGraphemes(targetText), state.units, config.scoringPolicy ?? (config.mode === 'code' ? 'code' : 'prose'), options.finiteFinal, state.submissions, { includeWords: true }).words;
}
/** A playback frame uses the same replay and scoring without building an unused timeline. */
export function replaySnapshot(config: SessionConfig, events: SessionEvent[], elapsedMs: number, options: ReplayOptions = {}) {
  const { state, targetText } = prepareReplay(config, events, elapsedMs, options);
  return { ...calculateMetrics(config, targetText, state, elapsedMs, { ...options, includeRhythm: false }), finalText: state.units.join('') };
}
/** Pure replay used by the UI, durable records, exports, and server validation. */
export function replaySession(config: SessionConfig, events: SessionEvent[], elapsedMs: number, options: ReplayOptions = {}) {
  const { state, accepted, targetText, initialTarget, segments, pauses } = prepareReplay(config, events, elapsedMs, options);
  const result = calculateMetrics(config, targetText, state, elapsedMs, options);
  const timeSeries: TimeSample[] = [];
  const sampledState = emptyTranscript();
  let eventIndex = 0;
  let previousAttempts = 0;
  let previousIncorrect = 0;
  let cachedSample: ReturnType<typeof calculateMetrics> | null = null;
  let cachedEventIndex = -1;
  let sampleTarget = segments ? initialTarget : targetText;
  let sampleSegmentIndex = 0;
  let cachedTarget = '';
  for (let start = 0; start < elapsedMs; start += 1000) {
    const end = Math.min(elapsedMs, start + 1000);
    while (eventIndex < accepted.length && (activeOffset(accepted[eventIndex].event.offsetMs, pauses) < end || (end === elapsedMs && activeOffset(accepted[eventIndex].event.offsetMs, pauses) === end))) {
      const acceptedEdit = accepted[eventIndex++];
      applyEvent(sampledState, acceptedEdit.event, acceptedEdit.targetText, config);
    }
    while (segments && sampleSegmentIndex < segments.length && activeOffset(segments[sampleSegmentIndex].offsetMs, pauses) <= end) sampleTarget += segments[sampleSegmentIndex++].text;
    const bucketAttempts = sampledState.attempts.length - previousAttempts;
    const totalIncorrect = sampledState.attempts.length - sampledState.correctAttemptCount;
    if (!cachedSample || cachedEventIndex !== eventIndex || cachedTarget !== sampleTarget || (end === elapsedMs && options.finiteFinal)) {
      cachedSample = calculateMetrics(config, sampleTarget, sampledState, end, { includeRhythm: false, finiteFinal: end === elapsedMs && options.finiteFinal });
      cachedEventIndex = eventIndex;
      cachedTarget = sampleTarget;
    }
    timeSeries.push({ offsetMs: end, seconds: end / 1000, wpm: config.scoringPolicy === 'free' ? null : rate(cachedSample.metrics.creditedUnits, end), rawWpm: rate(cachedSample.metrics.retainedUnits, end), localWpm: rate(bucketAttempts, end - start) ?? 0, errors: totalIncorrect - previousIncorrect, bucketDurationMs: end - start });
    previousAttempts = sampledState.attempts.length;
    previousIncorrect = totalIncorrect;
  }
  return { ...result, finalText: state.units.join(''), timeSeries };
}
