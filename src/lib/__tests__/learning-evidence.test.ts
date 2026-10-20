import { SessionController } from '../typing-core';
import { describe, expect, it } from 'vitest';
import { learningEvidenceFromResult } from '../learning-evidence';

describe('Canonical learning evidence projection', () => {
  function session(target: string, inputMethod = 'keyboard') {
    let time = 1000;
    const controller = new SessionController({ clientSessionId: 'evidence-test', mode: 'learn', initialTarget: target, rejectIncorrect: true, language: 'en', keyboardLayout: 'qwerty', inputMethod, settings: { targetWpm: 35 } }, { now: () => time, wallNow: () => 1_760_000_000_000 + time });
    return { controller, advance: (ms: number) => { time += ms; } };
  }
  it('derives rejected expected characters and errors from the shared replay', () => {
    const { controller, advance } = session('eat');
    controller.input({ type: 'insert', text: 'x' }); advance(200);
    controller.input({ type: 'insert', text: 'e' }); advance(200);
    controller.input({ type: 'insert', text: 'a' }); advance(200);
    controller.input({ type: 'insert', text: 't' });
    const evidence = learningEvidenceFromResult(controller.result!);
    expect(evidence.attempts.map(attempt => [attempt.expected, attempt.typed, attempt.correct])).toEqual([['e', 'x', false], ['e', 'e', true], ['a', 'a', true], ['t', 't', true]]);
    expect(evidence.attempts[0]).toMatchObject({ classification: 'trigger', latencyMs: null });
    expect(evidence.attempts[1].latencyMs).toBe(200);
    expect(evidence.assessment).toBe(true);
  });
  it('excludes simultaneous composition commits and recognizes actual input method', () => {
    const { controller } = session('eat');
    controller.input({ type: 'composition', text: 'eat', compositionId: 'group', provenance: 'composition' });
    const evidence = learningEvidenceFromResult(controller.result!);
    expect(evidence.dimensions.inputMethod).toBe('composition');
    expect(evidence.attempts).toHaveLength(3);
    expect(evidence.attempts.every(attempt => !attempt.attributable && attempt.latencyMs === null)).toBe(true);
  });
  it('excludes short explicit pauses from latency and preserves active duration', () => {
    const { controller, advance } = session('eat');
    controller.input({ type: 'insert', text: 'e' }); advance(100);
    controller.pause(); advance(1000); controller.resume(); advance(100);
    controller.input({ type: 'insert', text: 'a' }); advance(200);
    controller.input({ type: 'insert', text: 't' });
    const evidence = learningEvidenceFromResult(controller.result!);
    expect(evidence.elapsedMs).toBe(400);
    expect(evidence.attempts[1]).toMatchObject({ classification: 'inactivity', latencyMs: null });
    expect(evidence.attempts[2].latencyMs).toBe(200);
  });
  it('keeps partial and mixed review sessions out of initial mastery assessments', () => {
    const { controller } = session('eat');
    controller.input({ type: 'insert', text: 'e' });
    expect(learningEvidenceFromResult(controller.finish('manual')).assessment).toBe(false);
  });
  it('retains course key observations without granting adaptive mastery checkpoints', () => {
    let time = 0;
    const controller = new SessionController({ clientSessionId: 'course-evidence', mode: 'learn', initialTarget: 'fj fj', keyboardLayout: 'qwerty', language: 'en', settings: { course: { courseId: 'typing-course-v1', lessonId: 'home-anchors', variantId: 'a', assessmentVersion: 'typing-course-assessment-v1' } } }, { now: () => time, wallNow: () => 1_760_000_000_000 + time });
    for (const text of 'fj fj') { time += 200; controller.input({ type: 'insert', text }); }
    const evidence = learningEvidenceFromResult(controller.result!);
    expect(evidence.assessment).toBe(false);
    expect(evidence.attempts).toHaveLength(5);
    expect(evidence.attempts.every(attempt => attempt.correct)).toBe(true);
    expect(evidence.attempts.filter(attempt => attempt.latencyMs !== null)).toHaveLength(4);
  });
});
