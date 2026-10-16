import { replaySession, activeOffset } from '../../../src/lib/typing-core/metrics.ts';
import { comparisonContent, comparisonKey } from '../../../src/lib/typing-core/session.ts';
import { normalizeTarget, replayTranscript, targetGraphemes } from '../../../src/lib/typing-core/transcript.ts';
import { learningEvidenceFromResult } from '../../../src/lib/learning-evidence.ts';
import type { SessionResult } from '../../../src/lib/typing-core/types.ts';

export class ValidationError extends Error {}
const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => { if (!condition) throw new ValidationError(message); };
export function stablePayload(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stablePayload).join(',')}]`;
  return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${stablePayload(v)}`).join(',')}}`;
}
export async function sha256(value: unknown) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stablePayload(value)));
  return `sha256:${Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2,'0')).join('')}`;
}

/** Replay recomputes correctness from expected text. Client metrics are only compared. */
export function validateCandidate(input: unknown, owner: string, options: { interim?: boolean; cloudConsent?: boolean } = {}) {
  assert(input && typeof input === 'object', 'A session candidate is required.');
  const candidate = input as SessionResult;
  assert(candidate.schemaVersion === 3 && candidate.metricsVersion === 'forge-v3', 'Unsupported session version.');
  assert(typeof candidate.clientSessionId === 'string' && /^[A-Za-z0-9:_-]{1,128}$/.test(candidate.clientSessionId), 'Invalid client session ID.');
  assert(candidate.ownerScope === owner, 'This session belongs to another account.');
  const config = candidate.configuration;
  assert(config && config.clientSessionId === candidate.clientSessionId, 'Configuration identity mismatch.');
  assert(!config.ownerScope || config.ownerScope===owner,'Configuration owner mismatch.');
  assert(candidate.initialTarget===config.initialTarget,'Initial target identity mismatch.');
  assert(['time','words','quote','code','zen','custom','learn','learning','race'].includes(config.mode), 'Unsupported mode.');
  assert(['prose','code','free'].includes(config.scoringPolicy ?? 'prose'), 'Unsupported scoring policy.');
  assert(config.correctionPolicy === undefined || config.correctionPolicy === 'current-word', 'Unsupported correction policy.');
  assert(typeof config.initialTarget === 'string' && config.initialTarget.length <= 40_000, 'Target exceeds the cloud validation limit.');
  assert(typeof candidate.targetText === 'string' && candidate.targetText.length <= 40_000, 'Issued target exceeds the cloud validation limit.');
  assert(Number.isFinite(candidate.elapsedMs) && candidate.elapsedMs >= 0 && candidate.elapsedMs <= 600_000, 'Cloud sessions must be at most ten minutes. The local summary remains available.');
  assert(Number.isFinite(candidate.wallDurationMs) && candidate.wallDurationMs >= candidate.elapsedMs, 'Invalid wall duration.');
  const validWallTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 8_640_000_000_000_000;
  assert(validWallTime(candidate.finishedAtWall), 'Invalid wall finish timestamp.');
  assert(candidate.startedAtWall === null || validWallTime(candidate.startedAtWall), 'Invalid wall start timestamp.');
  assert(['completed','timeout','manual','abandoned'].includes(candidate.finishReason), 'Unknown finish reason.');
  assert(['ready','running','paused','finished'].includes(candidate.status), 'Unknown session status.');
  if (candidate.startedAtWall !== null) {
    // Wall clocks are metadata, not a trusted timer. Allow ordinary clock-read jitter,
    // but reject contradictory chronology instead of persisting misleading history.
    assert(candidate.finishedAtWall >= candidate.startedAtWall && Math.abs(candidate.finishedAtWall - candidate.startedAtWall - candidate.wallDurationMs) <= 1000, 'Wall timestamps do not match the recorded duration.');
  }
  assert(Array.isArray(candidate.events) && candidate.events.length <= 20_000, 'Event count exceeds the cloud resource limit.');
  assert(Array.isArray(candidate.pauseIntervals) && candidate.pauseIntervals.length <= 1000, 'Invalid pause evidence.');
  assert(Boolean(config.paused)===Boolean(candidate.pauseIntervals.length),'Pause comparison dimensions must match actual evidence.');
  if(config.durationMs!==undefined) assert(Number.isFinite(config.durationMs)&&config.durationMs>0&&config.durationMs<=600_000,'Invalid configured duration.');
  if(config.mode==='time') assert(config.durationMs!==undefined&&candidate.elapsedMs<=config.durationMs,'Timed sessions require a valid configured deadline.');
  assert(Array.isArray(candidate.issuedTargetSegments) && candidate.issuedTargetSegments.length <= 1000, 'Invalid target extensions.');
  if (candidate.startedAtWall === null) assert(candidate.elapsedMs === 0 && candidate.wallDurationMs === 0 && candidate.events.length === 0 && candidate.pauseIntervals.length === 0 && candidate.finishReason !== 'completed' && candidate.finishReason !== 'timeout', 'An unstarted session cannot contain timed input evidence.');
  assert(typeof candidate.finalText === 'string' && candidate.finalText.length <= 40_000, 'Invalid final transcript.');
  if (!options.interim) assert(candidate.status === 'finished', 'Only completed snapshots can be saved as sessions.');
  if (config.mode === 'custom' || config.scoringPolicy === 'free' || config.privacy === 'private-custom') assert(options.cloudConsent === true, 'Private custom content requires explicit cloud-storage consent.');
  let pauseEnd = -1;
  for (const pause of candidate.pauseIntervals) {
    assert(Number.isFinite(pause.startMs) && Number.isFinite(pause.endMs) && pause.startMs >= 0 && pause.startMs >= pauseEnd && pause.endMs >= pause.startMs && pause.endMs <= candidate.wallDurationMs, 'Pause ranges must be ordered, bounded, and non-overlapping.');
    pauseEnd = pause.endMs;
  }
  const activeWallDuration = activeOffset(candidate.wallDurationMs, candidate.pauseIntervals);
  if (candidate.finishReason === 'timeout') assert(config.durationMs !== undefined && candidate.elapsedMs === config.durationMs && activeWallDuration >= config.durationMs, 'A timeout must reach the configured active deadline.');
  else assert(Math.abs(activeWallDuration - candidate.elapsedMs) <= 0.001, 'Active duration does not match wall duration and pauses.');
  let previous = -1; let sequence = -1;
  for (const event of candidate.events) {
    assert(event && typeof event.text === 'string' && event.text.length <= 4096, 'Invalid edit payload.');
    assert(Number.isFinite(event.offsetMs) && event.offsetMs >= previous && event.offsetMs <= candidate.wallDurationMs, 'Event timestamps must be ordered within the recorded wall duration.');
    assert(Number.isInteger(event.sequence) && event.sequence === sequence + 1, 'Event sequence must be complete and contiguous.');
    assert(['keyboard','composition','paste','drop','autocorrect','generated'].includes(event.provenance), 'Unknown input provenance.');
    assert(activeOffset(event.offsetMs, candidate.pauseIntervals) <= candidate.elapsedMs, 'An event exceeds the accepted duration.');
    if(config.mode==='time')assert(activeOffset(event.offsetMs,candidate.pauseIntervals)<config.durationMs!,'Timed event at or after the deadline.');
    previous = event.offsetMs; sequence = event.sequence;
  }
  let target = normalizeTarget(config.initialTarget, config.scoringPolicy); let lastSegment = -1;
  const composition=candidate.events.some(event=>event.provenance==='composition');
  if(composition)assert(config.inputMethod==='composition','Input-method comparison dimensions do not match composition evidence.');
  for (const segment of candidate.issuedTargetSegments) {
    assert(config.mode==='time'||config.mode==='zen','This mode does not permit target extensions.');
    assert(typeof segment.text === 'string' && Number.isFinite(segment.offsetMs) && segment.offsetMs >= lastSegment && segment.offsetMs <= candidate.wallDurationMs, 'Invalid target extension order.');
    assert(segment.afterSequence === undefined || (Number.isInteger(segment.afterSequence) && segment.afterSequence >= -1 && segment.afterSequence < candidate.events.length), 'Invalid target issuance sequence.');
    lastSegment = segment.offsetMs; target += segment.text;
  }
  assert(target === candidate.targetText, 'Issued target does not reconstruct the displayed target.');
  const finiteFinal = !['time','zen'].includes(config.mode) && config.scoringPolicy !== 'free' && !options.interim;
  const replay = replaySession(config,candidate.events,candidate.elapsedMs,{ targetText: target,pauseIntervals:candidate.pauseIntervals,finiteFinal,issuedTargetSegments:candidate.issuedTargetSegments });
  assert(replay.finalText === candidate.finalText && candidate.finalTranscript === candidate.finalText, 'The event replay does not match the final transcript.');
  assert(stablePayload(replay.metrics) === stablePayload(candidate.metrics), 'The replayed metrics differ from the local candidate. Keep the local result for investigation.');
  if (candidate.finishReason === 'completed') assert(replay.metrics.progress === 100 && config.scoringPolicy !== 'free', 'A completed target must be fully processed.');
  const canonicalComparison = comparisonKey({ ...config, comparisonKey: undefined });
  assert(candidate.comparisonKey === canonicalComparison, 'Comparison dimensions do not match the session configuration.');
  const attempts = replayTranscript(config,candidate.events,Infinity,target,candidate.issuedTargetSegments).attempts;
  let issuedText = normalizeTarget(config.initialTarget,config.scoringPolicy);
  let lateTargetExtension = false;
  for (const segment of candidate.issuedTargetSegments) {
    const limit = targetGraphemes(issuedText).length;
    if (attempts.some(attempt => attempt.expected === undefined && attempt.position >= limit && (attempt.offsetMs < segment.offsetMs || (attempt.offsetMs === segment.offsetMs && attempt.eventSequence <= (segment.afterSequence ?? -1))))) lateTargetExtension = true;
    issuedText += segment.text;
  }
  const personalBestEligible = comparisonContent(config).eligible && !lateTargetExtension && replay.metrics.wpm !== null && !config.repeatedContent && !candidate.pauseIntervals.length && !candidate.events.some(event => ['paste','drop','autocorrect','generated'].includes(event.provenance)) && (!config.durationMs || candidate.elapsedMs === config.durationMs) && !(candidate.finishReason === 'manual' && !['time','zen'].includes(config.mode) && replay.metrics.progress < 100);
  return { candidate, replay, comparisonKey: canonicalComparison, keySummaries: deriveKeys(candidate), lateTargetExtension, personalBestEligible };
}

function deriveKeys(candidate: SessionResult) {
  const evidence = learningEvidenceFromResult(candidate);
  const dimensions = JSON.stringify([evidence.dimensions.language,evidence.dimensions.layout,evidence.dimensions.inputMethod,evidence.dimensions.domain]);
  const keys = new Map<string,{character:string;dimensions:string;attempts:number;correctAttempts:number;intervalCount:number;intervalSumMs:number}>();
  for (const attempt of evidence.attempts) {
    const character = attempt.expected;
    if (!character || character.trim() === '') continue;
    const key = keys.get(character) ?? {character,dimensions,attempts:0,correctAttempts:0,intervalCount:0,intervalSumMs:0};
    key.attempts++;
    if (attempt.correct) key.correctAttempts++;
    if (attempt.latencyMs !== null) { key.intervalCount++; key.intervalSumMs += attempt.latencyMs; }
    keys.set(character,key);
  }
  return Array.from(keys.values());
}

