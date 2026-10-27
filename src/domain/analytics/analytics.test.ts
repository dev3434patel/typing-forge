import { describe, expect, it } from 'vitest';
import { SessionController, type SessionConfig, type SessionResult } from '@/lib/typing-core';
import { assessCourseResult, buildCourseConfiguration, courseAssessmentForRecord } from '@/lib/typing-course';
import { SessionRepository, type SessionRecord } from '@/services/session-repository';
import { sessionInsights } from './session-insights';
import { analyticsDashboard, privateShareProjection } from './dashboard';
import { assessPlacement, assessPlacementRecords, placementConfiguration, placementPartFromResult, validPlacementPart } from '../training/placement';
import { trainingAchievementFromResult } from '../training/course-achievements';
import { cohortLabel } from '@/services/history-model';

function run(config: SessionConfig, mistake = false) {
  let now = 0;
  const controller = new SessionController(config, { now: () => now, wallNow: () => 1700000000000 + now });
  const text = config.durationMs ? config.initialTarget.slice(0, 60) : config.initialTarget;
  for (const [index, key] of [...text].entries()) {
    if (mistake && index === 1) { controller.input({ type: 'insert', text: 'X' }); now += 100; controller.input({ type: 'delete' }); now += 100; }
    controller.input({ type: 'insert', text: key }); now += 100;
  }
  if (config.durationMs) { now = config.durationMs; controller.tick(); }
  return structuredClone(controller.result ?? controller.finish('completed'));
}
const custom = (id = 'session', owner = 'alice'): SessionConfig => ({ clientSessionId: id, ownerScope: owner, mode: 'custom', initialTarget: 'cat dog', inputMethod: 'keyboard', keyboardLayout: 'qwerty', language: 'en', scoringPolicy: 'prose', correctionPolicy: 'correct-words-locked' });
function record(result: SessionResult, overrides: Partial<SessionRecord> = {}): SessionRecord {
  const metrics = result.metrics;
  return { schemaVersion: 3, ownerId: result.ownerScope, clientSessionId: result.clientSessionId, payloadVersion: 'forge-v3', payloadHash: `test:${result.clientSessionId}`, summary: { id: result.clientSessionId, mode: result.configuration.mode, wpm: metrics.wpm ?? 0, rawWpm: metrics.rawWpm ?? 0, accuracy: metrics.inputAccuracy ?? 0, consistency: metrics.consistency ?? 0, duration: result.elapsedMs / 1000, correctChars: metrics.correct, incorrectChars: metrics.incorrect, totalChars: metrics.retainedUnits, errors: metrics.incorrectAttempts, date: new Date(result.finishedAtWall).toISOString(), wpmHistory: [] }, metricSummary: metrics, courseEvidence: assessCourseResult(result) ?? undefined, placementEvidence: placementPartFromResult(result) ?? undefined, comparisonKey: result.comparisonKey, personalBestEligible: result.eligibility.eligible, candidate: result, privateContent: true, cloudConsent: false, provenance: 'observed', state: 'local-only', attempts: 0, nextAttemptAt: 0, createdAt: result.finishedAtWall, evidenceExpiresAt: 0, ...overrides };
}
describe('canonical analytics and retained learning projections', () => {
  it('keeps corrected mistakes in insertion diagnostics while final text has no error edits', () => {
    const result = run(custom(), true), insight = sessionInsights(result)!;
    expect(insight.keys.find(item => item.key === 'a')).toMatchObject({ n: 2, correct: 1 });
    expect(Object.values(insight.errors).reduce((sum, value) => sum + value, 0)).toBe(0);
    expect(insight.nextAction.reason).toContain('More evidence');
  });
  it('does not invent latency for the first key or call a reference assignment observed finger use', () => {
    const insight = sessionInsights(run({ ...custom(), initialTarget: 'a' }))!;
    expect(insight.keys[0].speedMs).toBeNull();
    expect(insight.fingers[0].finger).toBe('left-pinky');
  });
  it('retains separator attempts for reference-thumb measurements without making spaces a letter drill', () => {
    const insight = sessionInsights(run(custom()))!;
    expect(insight.keys.find(item => item.key === ' ')).toMatchObject({ n: 1, correct: 1 });
    expect(insight.fingers.find(item => item.finger === 'thumb')).toMatchObject({ n: 1 });
    expect(insight.nextAction.keys).not.toContain(' ');
  });
  it('does not diagnose an untyped timed suffix as omitted input', () => {
    const result = run({ ...custom(), mode: 'time', durationMs: 30000, initialTarget: 'a '.repeat(100) });
    expect(sessionInsights(result)?.errors.omission).toBe(0);
  });
  it('rejects malformed replay instead of making up diagnostic counts', () => {
    const result = run(custom()); result.events[0].sequence = -1;
    expect(sessionInsights(result)).toBeNull();
  });
  it('creates a statistics-only share projection from replay, not caller metrics or personal text', () => {
    const result = run(custom());
    const actual = result.metrics.wpm; result.metrics.wpm = 9999;
    const value = privateShareProjection(result);
    expect(value.metrics.wpm).toBe(actual);
    const serialized = JSON.stringify(value);
    for (const privateValue of ['alice', 'session', 'cat dog', 'events', 'initialTarget', 'comparisonKey']) expect(serialized).not.toContain(privateValue);
  });
  it('preserves separate personal bests for exact comparison contracts', () => {
    const a = run(custom('a')), b = run({ ...custom('b'), correctionPolicy: 'current-word' });
    const rows = [record(a, { personalBestEligible: true }), record(b, { personalBestEligible: true })];
    expect(analyticsDashboard(rows, 'alice').personalBests).toHaveLength(2);
    expect(cohortLabel(a.comparisonKey)).toContain('correct-words-locked');
    expect(cohortLabel(b.comparisonKey)).toContain('current-word');
    expect(cohortLabel(a.comparisonKey)).not.toBe(cohortLabel(b.comparisonKey));
  });
  it('never mixes another owner into dashboard counts, keys or stars', () => {
    const a = run(custom('a')), b = run(custom('b', 'bob'));
    expect(analyticsDashboard([record(a), record(b)], 'alice').totalSessions).toBe(1);
    expect(analyticsDashboard([record(a), record(a)], 'alice').totalSessions).toBe(1);
  });
  it('uses accepted course assessment before candidate and retained summary, including accepted failure', () => {
    const result = run(buildCourseConfiguration('home-anchors', { ownerId: 'alice', clientSessionId: 'course', variantId: 'a' }));
    const passed = assessCourseResult(result)!;
    expect(passed.qualifies).toBe(true);
    const failed = { ...passed, qualifies: false, checks: { ...passed.checks, completed: false }, reasonCodes: ['completion'] };
    expect(courseAssessmentForRecord(record(result, { accepted: { course: failed } }), 'alice')?.qualifies).toBe(false);
    expect(courseAssessmentForRecord(record(result, { accepted: { course: null } }), 'alice')).toBeNull();
  });
  it('keeps a validated course summary and stars after raw replay expiry', async () => {
    const result = run(buildCourseConfiguration('home-anchors', { ownerId: 'alice', clientSessionId: 'course-expiry', variantId: 'a' }));
    const repository = new SessionRepository(); await repository.save(record(result)); await repository.expireEvidence();
    const retained = (await repository.list('alice'))[0];
    expect(retained.candidate).toBeUndefined();
    expect(courseAssessmentForRecord(retained, 'alice')?.qualifies).toBe(true);
    expect(analyticsDashboard([retained], 'alice').stars[0].stars).toBe(3);
  });
  it('does not accept another owner or rejected/legacy course evidence', () => {
    const result = run(buildCourseConfiguration('home-anchors', { ownerId: 'alice', clientSessionId: 'course-owner', variantId: 'a' }));
    expect(courseAssessmentForRecord(record(result), 'bob')).toBeNull();
    expect(courseAssessmentForRecord(record(result, { state: 'rejected' }), 'alice')).toBeNull();
    expect(courseAssessmentForRecord(record(result, { provenance: 'legacy' }), 'alice')).toBeNull();
  });
  it('gives qualifying course stars only from canonical assessment', () => {
    const result = run(buildCourseConfiguration('home-anchors', { ownerId: 'alice', clientSessionId: 'stars', variantId: 'a' }));
    expect(trainingAchievementFromResult(result)).toMatchObject({ qualified: true, stars: 3, practiceAssist: false });
    result.configuration.settings = { review: true, training: { practiceAssist: true, lessonId: 'home-anchors' } };
    expect(trainingAchievementFromResult(result)).toMatchObject({ qualified: false, stars: 0, practiceAssist: true });
  });
  it('requires all3 full placement parts from one explicit run', () => {
    const parts = [0, 1, 2].map(stage => run(placementConfiguration('alice', `part-${stage}`, stage, 'run-one')));
    expect(assessPlacement(parts.slice(0, 2), 'alice')).toBeNull();
    expect(assessPlacement(parts, 'alice')).toMatchObject({ version: 'placementV1', qualification: 'local-guidance-only' });
    const mixed = [...parts.slice(0, 2), run(placementConfiguration('alice', 'other-part', 2, 'run-two'))];
    expect(assessPlacement(mixed, 'alice')).toBeNull();
    expect(assessPlacement(parts, 'bob')).toBeNull();
  });
  it('retains bounded placement facts after replay expiry without duplicating keys or passage text', () => {
    const parts = [0, 1, 2].map(stage => run(placementConfiguration('alice', `retained-${stage}`, stage, 'retained-run')));
    const rows = parts.map(part => record(part, { candidate: undefined }));
    expect(assessPlacementRecords(rows, 'alice')?.sessionIds).toHaveLength(3);
    expect(assessPlacementRecords(rows.map(row => ({ ...row, ownerId: 'bob' })), 'bob')).toBeNull();
    const text = JSON.stringify(rows[0].placementEvidence);
    expect(text).not.toContain('initialTarget'); expect(text).not.toContain('events'); expect(text).not.toContain('text');
  });
  it('refuses tampered retained placement identity, metric version and numerical facts', () => {
    const result = run(placementConfiguration('alice', 'validated', 0, 'validated-run'));
    const evidence = placementPartFromResult(result)!;
    expect(validPlacementPart(evidence, 'alice', 'validated')).toBe(true);
    for (const patch of [{ ownerId: 'bob' }, { sessionId: 'wrong' }, { metricsVersion: 'invented' }, { inputAccuracy: 101 }, { insertionAttempts: 2 }, { wpm: 99999 }, { runId: undefined }]) expect(validPlacementPart({ ...evidence, ...patch }, 'alice', 'validated')).toBe(false);
  });
  it('does not qualify bulk/composition or incomplete placement input', () => {
    const result = run(placementConfiguration('alice', 'unassisted', 0, 'assistance-run'));
    result.events[0].provenance = 'composition'; expect(placementPartFromResult(result)).toBeNull();
    result.events[0].provenance = 'keyboard'; result.finishReason = 'manual'; expect(placementPartFromResult(result)).toBeNull();
  });
});
