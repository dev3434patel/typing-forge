import { describe, expect, it } from 'vitest';
import { SessionController, type SessionConfig } from '@/lib/typing-core';
import { practiceConfiguration } from './placement';
import { assessPracticeGoal } from './practice-goal';
function run(id: string, interval = 100, patch: Partial<SessionConfig> = {}, mistakes = 0) {
  const config = { ...practiceConfiguration({ owner: 'guest', sessionId: id, seed: 'same', kind: 'keys', keys: [...'asdf'], practiceAssist: true }), ...patch };
  let now = 0;
  const session = new SessionController(config, { now: () => now, wallNow: () => 1700000000000 + now });
  for (let i = 0; i < mistakes; i++) { session.input({ type: 'insert', text: 'X' }); now += interval; session.input({ type: 'delete' }); now += interval; }
  for (const key of config.initialTarget) { session.input({ type: 'insert', text: key }); now += interval; }
  return structuredClone(session.result ?? session.finish('completed'));
}
describe('named private practice goals without course authority', () => {
  it('uses the cold-stage target when comparable evidence is absent', () => expect(assessPracticeGoal(run('first'), [], 15)).toMatchObject({ source: 'cold-start', targetWpm: 15, courseQualification: false }));
  it('uses 105 percent of the median of canonical comparable speeds', () => {
    const previous = run('previous', 200), current = run('current'); previous.finishedAtWall = current.finishedAtWall - 1;
    previous.metrics.wpm = 9999;
    const goal = assessPracticeGoal(current, [previous])!;
    expect(goal.source).toBe('rolling-median-105pct'); expect(goal.targetWpm).toBeLessThan(1000); expect(goal.passed).toBe(true);
  });
  it('does not create a new pass by repeating an identical speed', () => {
    const previous = run('previous'), current = run('current'); previous.finishedAtWall = current.finishedAtWall - 1;
    expect(assessPracticeGoal(current, [previous])?.speedPassed).toBe(false);
  });
  it('does not count duplicate IDs twice in the rolling window', () => {
    const previous = run('previous'), current = run('current'); previous.finishedAtWall = current.finishedAtWall - 1;
    expect(assessPracticeGoal(current, [previous, previous, previous])?.comparableAttempts).toBe(1);
  });
  it.each([{ ownerScope: 'someone-else' }, { keyboardLayout: 'dvorak' }, { inputMethod: 'virtual' }, { correctionPolicy: 'current-word' as const }])('keeps different practice dimensions separate%j', patch => {
    const previous = run('previous', 100, patch), current = run('current'); previous.finishedAtWall = current.finishedAtWall - 1;
    expect(assessPracticeGoal(current, [previous])?.source).toBe('cold-start');
  });
  it('requires 90 percent insertion accuracy without deleting the cost of corrections', () => {
    expect(assessPracticeGoal(run('mistakes', 100, {}, 30), [], 1)?.accuracyPassed).toBe(false);
  });
  it('cannot replace the fixed course assessment', () => {
    const current = run('ordinary'); current.configuration.contentRevision = 'typing-course-v1';
    expect(assessPracticeGoal(current)).toBeNull();
  });
  it('does not set a target from a prematurely ended or partially completed prior attempt', () => {
    const previous = run('previous'), current = run('current'); previous.finishedAtWall = current.finishedAtWall - 1;
    previous.events = previous.events.slice(0, 4);
    expect(assessPracticeGoal(current, [previous])?.comparableAttempts).toBe(0);
  });
});
