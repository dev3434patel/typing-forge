import { describe, expect, it } from 'vitest';
import {
  SessionController, alignTranscript, applyEvent, calculateMetrics,
  emptyTranscript, graphemes, replaySession, targetGraphemes,
  type SessionResult,
} from '..';

function expectDeeplyFrozen(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeeplyFrozen(child);
}

function expectIndependentEvidence(result: SessionResult, finiteFinal: boolean) {
  const state = emptyTranscript();
  for (const event of result.events)
    applyEvent(state, event, result.targetText, result.configuration);
  // A fresh external array cannot use the factory-owned target-word metadata.
  const external = alignTranscript(graphemes(result.targetText), [...state.units], 'prose', finiteFinal, [...state.submissions], { includeWords: true });
  const expected = calculateMetrics(result.configuration, result.targetText, state, result.elapsedMs, { finiteFinal, pauseIntervals: result.pauseIntervals, alignment: external });
  expect(result.characters).toEqual(external.characters);
  expect(result.metrics).toEqual(expected.metrics);
  const replayed = replaySession(result.configuration, result.events, result.elapsedMs, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals, finiteFinal });
  expect(result.timeSeries).toEqual(replayed.timeSeries);
  expect(result.finalText).toBe(state.units.join(''));
  expect(result.finalTranscript).toBe(result.finalText);
  expect(result.cursor).toBe(replayed.cursor);
}

describe('complete immutable checkpoint publications', () => {
  it('reuses an800-word factory target while preserving full evidence, wire order and old publications', () => {
    const words = Array.from({ length: 800 }, (_, index) => `forge${index.toString(36).padStart(3, '0')}`);
    const target = words.join(' ');
    expect(graphemes(target).length).toBeGreaterThan(4096);
    expect(graphemes(target).length).toBeLessThanOrEqual(8192);
    const factoryTarget = targetGraphemes(target);
    let now = 0;
    const controller = new SessionController({ clientSessionId: 'arena800-immutable-publication', mode: 'race', durationMs: 30000, initialTarget: target, correctionPolicy: 'correct-words-locked', settings: { source: { tag: 'arena-capacity', labels: ['bounded800'] } } }, { now: () => now, wallNow: () => 1_700_000_000_000 + now });
    controller.startAt(0, 1_700_000_000_000);
    now = 1000;
    controller.input({ type: 'insert', text: words.slice(0, 10).join(' ') + ' ' });
    now = 2000;
    const checkpoint = controller.checkpoint();
    expect(checkpoint.status).toBe('running');
    expect(controller.result).toBeNull();
    expect(checkpoint.characters).toHaveLength(graphemes(target).length);
    expect(checkpoint.targetText).toBe(target);
    expect(targetGraphemes(target)).toBe(factoryTarget);
    expectIndependentEvidence(checkpoint, false);
    expect(Object.keys(checkpoint)).toEqual(['status', 'finalText', 'targetText', 'elapsedMs', 'wallDurationMs', 'remainingMs', 'cursor', 'characters', 'metrics', 'events', 'timeSeries', 'schemaVersion', 'metricsVersion', 'learningVersion', 'clientSessionId', 'ownerScope', 'configuration', 'comparisonKey', 'initialTarget', 'issuedTargetSegments', 'finalTranscript', 'startedAtWall', 'finishedAtWall', 'pauseIntervals', 'finishReason', 'assistance', 'eligibility']);
    expectDeeplyFrozen(checkpoint);
    const oldBytes = JSON.stringify(checkpoint);
    expect(Reflect.set(checkpoint.characters[0], 'typed', '!')).toBe(false);
    expect(Reflect.set(checkpoint.events[0], 'text', 'forged')).toBe(false);
    const settings = checkpoint.configuration.settings as { source: { labels: string[] } };
    expect(Reflect.set(settings.source.labels, '0', 'forged')).toBe(false);
    expect(JSON.stringify(checkpoint)).toBe(oldBytes);
    now = 2500;
    controller.input({ type: 'insert', text: 'fo' });
    now = 3000;
    const next = controller.checkpoint();
    expectIndependentEvidence(next, false);
    expect(next.finalText).toBe(checkpoint.finalText + 'fo');
    expect(next.metrics.insertionAttempts).toBe(checkpoint.metrics.insertionAttempts + 2);
    expect(next.characters).not.toBe(checkpoint.characters);
    expect(targetGraphemes(target)).toBe(factoryTarget);
    expect(JSON.stringify(checkpoint)).toBe(oldBytes);
    now = 4000;
    const final = controller.finish('manual');
    expect(final.status).toBe('finished');
    expectIndependentEvidence(final, true);
    expectDeeplyFrozen(final);
    expect(final.eligibility.reasons).toContain('Incomplete timed session');
    expect(JSON.stringify(checkpoint)).toBe(oldBytes);
  });
});
