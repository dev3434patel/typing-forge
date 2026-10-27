import type { SessionConfig, SessionResult } from '@/lib/typing-core/types';
import { replaySnapshot } from '@/lib/typing-core/metrics';
import { COURSE_LESSONS } from '@/lib/typing-course';
import { generateTrainingDrill, type DrillKind } from './generator';
import type { SessionRecord } from '@/services/session-repository';

export const PLACEMENT_VERSION = 'placementV1';
export const PLACEMENT_PASSAGES = [
  'A calm hand finds a steady rhythm. Keep your eyes on these words and let each small movement settle into place.',
  'Clear practice builds control. Read a little ahead, give every letter its own space, and return to the home row with relaxed hands.',
  'Take 3 quiet minutes to plan a useful day. Write one clear goal, check the next step, and finish with care: steady progress begins here.',
] as const;
export interface PlacementPartEvidence {
  version: 'placement-part-v1'; metricsVersion: 'forge-v3'; sessionId: string; ownerId: string;
  runId: string; stage: number; completedAt: number; durationMs: 45000;
  wpm: number; inputAccuracy: number; insertionAttempts: number; correctAttempts: number;
  layout: 'qwerty'; language: 'en'; inputMethod: 'keyboard'; verification: 'local-guidance-only';
}
export function placementConfiguration(owner: string, sessionId: string, stage: number, runId = sessionId): SessionConfig {
  if (!Number.isInteger(stage) || stage < 0 || stage > 2) throw new Error('Choose placement stage0,1 or2.');
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(runId)) throw new Error('Placement needs a bounded run identity.');
  let target: string = PLACEMENT_PASSAGES[stage];
  while (target.length < 4000) target += ` ${PLACEMENT_PASSAGES[stage]}`;
  return { clientSessionId: sessionId, ownerScope: owner, mode: 'time', durationMs: 45000, initialTarget: target, scoringPolicy: 'prose', correctionPolicy: 'correct-words-locked', language: 'en', script: 'Latin', keyboardLayout: 'qwerty', inputMethod: 'keyboard', contentRevision: `${PLACEMENT_VERSION}:${stage}`, generatorVersion: 'placement-original-v1', seed: stage, privacy: 'private-custom', punctuation: true, numbers: stage === 2, settings: { review: true, training: { kind: 'placement', version: PLACEMENT_VERSION, stage, runId } } };
}
export function practiceConfiguration(options: { owner: string; sessionId: string; seed: string; kind: DrillKind; keys: readonly string[]; lessonId?: string; layout?: string; practiceAssist?: boolean; reviewKeys?: readonly string[]; weak?: Parameters<typeof generateTrainingDrill>[0]['weak']; focusSequences?: readonly string[] }): SessionConfig {
  return { clientSessionId: options.sessionId, ownerScope: options.owner, mode: options.kind === 'code' ? 'code' : 'custom', initialTarget: generateTrainingDrill({ seed: options.seed, keys: options.keys, kind: options.kind, reviewKeys: options.reviewKeys, weak: options.weak, focusSequences: options.focusSequences }), scoringPolicy: options.kind === 'code' ? 'code' : 'prose', ...(options.kind === 'code' ? {} : { correctionPolicy: 'correct-words-locked' as const }), language: 'en', script: 'Latin', keyboardLayout: options.layout ?? 'qwerty', inputMethod: 'keyboard', contentRevision: 'training-practice-v1', generatorVersion: 'sparow-training-original-v1', seed: options.seed, privacy: 'private-custom', settings: { review: true, training: { kind: options.kind, lessonId: options.lessonId, alphabet: [...new Set(options.keys)].sort().join(''), practiceAssist: options.practiceAssist === true } } };
}
export function placementPartFromResult(result: SessionResult): PlacementPartEvidence | null {
    const training = result.configuration.settings?.training as { kind?: string; version?: string; stage?: number; runId?: string } | undefined;
    const stage = training?.stage;
    if (training?.kind !== 'placement' || training.version !== PLACEMENT_VERSION || typeof stage !== 'number' || ![0, 1, 2].includes(stage) || typeof training.runId !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(training.runId)) return null;
    const expected = placementConfiguration(result.ownerScope, result.clientSessionId, stage, training.runId);
    const config = result.configuration;
    if (result.schemaVersion !== 3 || result.metricsVersion !== 'forge-v3' || !Number.isFinite(result.finishedAtWall) || result.status !== 'finished' || result.finishReason !== 'timeout' || result.elapsedMs !== 45000 || result.pauseIntervals.length || config.ownerScope !== result.ownerScope || config.clientSessionId !== result.clientSessionId || config.initialTarget !== expected.initialTarget || config.durationMs !== 45000 || config.mode !== 'time' || config.scoringPolicy !== 'prose' || config.keyboardLayout !== 'qwerty' || config.language !== 'en' || config.inputMethod !== 'keyboard' || config.contentRevision !== expected.contentRevision || config.settings?.course !== undefined || result.events.some(event => event.provenance !== 'keyboard' || event.type === 'composition' || event.text.length > 1 || event.compositionId !== undefined)) return null;
    try {
      const metrics = replaySnapshot(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, pauseIntervals: result.pauseIntervals, issuedTargetSegments: result.issuedTargetSegments }).metrics;
      if (metrics.wpm !== null && metrics.inputAccuracy !== null && metrics.insertionAttempts >= 25) return { version: 'placement-part-v1', metricsVersion: 'forge-v3', sessionId: result.clientSessionId, ownerId: result.ownerScope, runId: training.runId, stage, completedAt: result.finishedAtWall, durationMs: 45000, wpm: metrics.wpm, inputAccuracy: metrics.inputAccuracy, insertionAttempts: metrics.insertionAttempts, correctAttempts: metrics.correctAttempts, layout: 'qwerty', language: 'en', inputMethod: 'keyboard', verification: 'local-guidance-only' };
    } catch { /* Invalid local evidence cannot become a placement measurement. */ }
    return null;
}
export function validPlacementPart(value: unknown, owner: string, sessionId: string): value is PlacementPartEvidence {
  if (!value || typeof value !== 'object') return false;
  const part = value as PlacementPartEvidence;
  return part.version === 'placement-part-v1' && part.metricsVersion === 'forge-v3' && part.ownerId === owner && part.sessionId === sessionId && part.layout === 'qwerty' && part.language === 'en' && part.inputMethod === 'keyboard' && part.verification === 'local-guidance-only' && part.durationMs === 45000 && typeof part.runId === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(part.runId) && [0, 1, 2].includes(part.stage) && Number.isFinite(part.completedAt) && part.completedAt >= 0 && Number.isFinite(part.wpm) && part.wpm >= 0 && Number.isInteger(part.insertionAttempts) && part.insertionAttempts >= 25 && part.insertionAttempts <= 100000 && Number.isInteger(part.correctAttempts) && part.correctAttempts >= 0 && part.correctAttempts <= part.insertionAttempts && Number.isFinite(part.inputAccuracy) && Math.abs(part.inputAccuracy - part.correctAttempts / part.insertionAttempts * 100) < 1e-6 && part.wpm <= part.correctAttempts * 12000 / 45000 + 1e-6;
}
function aggregatePlacement(parts: readonly PlacementPartEvidence[], owner: string) {
  const runs = new Map<string, Map<number, PlacementPartEvidence>>();
  const seen = new Set<string>();
  for (const part of [...parts].sort((a, b) => a.completedAt - b.completedAt || a.sessionId.localeCompare(b.sessionId))) {
    if (!validPlacementPart(part, owner, part.sessionId) || seen.has(part.sessionId)) continue;
    seen.add(part.sessionId);
    const stages = runs.get(part.runId) ?? new Map<number, PlacementPartEvidence>();
    stages.set(part.stage, part); runs.set(part.runId, stages);
  }
  const complete = [...runs.values()].filter(stages => stages.size === 3).sort((a, b) => Math.max(...[...a.values()].map(item => item.completedAt)) - Math.max(...[...b.values()].map(item => item.completedAt)));
  const stages = complete.at(-1);
  if (!stages) return null;
  const values = [0, 1, 2].map(stage => stages.get(stage)!);
  const wpm = [...values.map(item => item.wpm)].sort((a, b) => a - b)[1];
  const attempts = values.reduce((sum, item) => sum + item.insertionAttempts, 0);
  const accuracy = values.reduce((sum, item) => sum + item.correctAttempts, 0) / attempts * 100;
  const index = accuracy < 90 ? 0 : accuracy < 95 ? 6 : wpm < 25 ? 12 : wpm < 45 ? 24 : 30;
  return { version: PLACEMENT_VERSION, ownerId: owner, sessionIds: values.map(item => item.sessionId), wpm, inputAccuracy: accuracy, attempts, recommendedLessonId: COURSE_LESSONS[index].id, completedAt: Math.max(...values.map(item => item.completedAt)), qualification: 'local-guidance-only' as const };
}
export function assessPlacement(results: readonly SessionResult[], owner: string) { return aggregatePlacement(results.flatMap(result => { const part = placementPartFromResult(result); return part ? [part] : []; }), owner); }
export function assessPlacementRecords(records: readonly SessionRecord[], owner: string) {
  return aggregatePlacement(records.flatMap(record => {
    if (record.ownerId !== owner || record.payloadVersion !== 'forge-v3' || record.provenance !== 'observed' || record.state === 'rejected') return [];
    const part = record.candidate ? placementPartFromResult(record.candidate as SessionResult) : record.placementEvidence;
    return validPlacementPart(part, owner, record.clientSessionId) ? [part] : [];
  }), owner);
}
