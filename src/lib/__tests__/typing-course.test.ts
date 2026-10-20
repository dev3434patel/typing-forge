import { describe, expect, it } from 'vitest';
import {
  COURSE_CATALOG, COURSE_CHAPTERS, COURSE_LESSONS, COURSE_ASSESSMENT_VERSION,
  assessCourseResult, buildCourseConfiguration, deriveCourseProgress, getCourseLesson, getCourseTarget,
  type CourseAssessment, type CourseVariantId,
} from '../typing-course';
import { SessionController, type SessionResult } from '../typing-core';
import { SessionRepository, type SessionRecord } from '../../services/session-repository';

const origin = 1_700_000_000_000;
function run(lessonId = 'home-anchors', variantId: CourseVariantId = 'a', options: {
  ownerId?: string; id?: string; startedAt?: number; mistakes?: number; pause?: boolean;
  manual?: boolean; characters?: number; bulk?: boolean; lateTick?: boolean;
} = {}): SessionResult {
  let now = 0;
  const config = buildCourseConfiguration(lessonId, { ownerId: options.ownerId ?? 'alice', clientSessionId: options.id ?? `${lessonId}-${variantId}`, variantId });
  const controller = new SessionController(config, { now: () => now, wallNow: () => origin + (options.startedAt ?? 0) + now });
  const length = options.characters ?? (config.mode === 'time' ? Math.ceil(getCourseLesson(lessonId)!.targetWpm * 2.5) + 3 : config.initialTarget.length);
  if (options.bulk) {
    controller.startAt(0);
    now = 4000;
    controller.input({ type: 'insert', text: config.initialTarget.slice(0, length) });
  } else {
    for (let index = 0; index < (options.mistakes ?? 0); index++) {
      controller.input({ type: 'insert', text: '#' }); now += 60;
      controller.input({ type: 'delete' }); now += 60;
    }
    for (const [index, char] of [...config.initialTarget.slice(0, length)].entries()) {
      if (index === 10 && options.pause) { controller.pause(); now += 500; controller.resume(); }
      controller.input({ type: 'insert', text: char }); now += 100;
    }
  }
  if (options.manual) return controller.finish('manual');
  if (config.mode === 'time') { now = (options.lateTick ? 34000 : 30000) + (options.pause ? 500 : 0); controller.tick(); }
  return controller.result ?? controller.finish('manual');
}
function record(result: SessionResult, overrides: Partial<SessionRecord> = {}): SessionRecord {
  const m = result.metrics;
  return {
    schemaVersion: 3, ownerId: result.ownerScope, clientSessionId: result.clientSessionId,
    payloadVersion: 'forge-v3', payloadHash: `test:${result.clientSessionId}`, candidate: result,
    courseEvidence: assessCourseResult(result) ?? undefined, metricSummary: m,
    summary: { id: result.clientSessionId, mode: result.configuration.mode, wpm: m.wpm ?? 0, rawWpm: m.rawWpm ?? 0,
      accuracy: m.inputAccuracy ?? 0, consistency: m.consistency ?? 0, duration: result.elapsedMs / 1000,
      correctChars: m.correct, incorrectChars: m.incorrect, totalChars: m.retainedUnits, errors: m.incorrectAttempts,
      date: new Date(result.finishedAtWall).toISOString(), wpmHistory: [] },
    privateContent: false, cloudConsent: false, provenance: 'observed', state: 'local-only', attempts: 0,
    nextAttemptAt: 0, createdAt: result.finishedAtWall, evidenceExpiresAt: result.finishedAtWall + 1000, ...overrides,
  };
}
function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }

describe('versioned English QWERTY curriculum', () => {
  it('contains six complete chapters, 36 lessons and 108 distinct ASCII passages', () => {
    expect(COURSE_CHAPTERS).toHaveLength(6);
    expect(COURSE_LESSONS).toHaveLength(36);
    expect(new Set(COURSE_LESSONS.map(lesson => lesson.id)).size).toBe(36);
    const passages = COURSE_LESSONS.flatMap(lesson => lesson.variants.map(variant => variant.text));
    expect(passages).toHaveLength(108);
    expect(new Set(passages).size).toBe(108);
    for (const chapter of COURSE_CHAPTERS) expect(COURSE_LESSONS.filter(lesson => lesson.chapterId === chapter.id)).toHaveLength(6);
    for (const text of passages) { expect(text).toMatch(/^[\x20-\x7e]+$/); expect(text.length).toBeGreaterThanOrEqual(40); expect(text.trim()).toBe(text); }
    expect(Object.isFrozen(COURSE_CATALOG)).toBe(true);
    expect(Object.isFrozen(COURSE_LESSONS[0].variants)).toBe(true);
  });
  it('introduces letters progressively before the complete alphabet checkpoint', () => {
    const introduced = new Set<string>([' ']);
    for (const lesson of COURSE_LESSONS.slice(0, 16)) {
      lesson.focusKeys.forEach(char => introduced.add(char));
      for (const variant of lesson.variants) for (const char of variant.text) expect(introduced.has(char), `${lesson.id} introduces ${char} before teaching it`).toBe(true);
    }
    expect([...introduced].filter(char => /[a-z]/.test(char)).sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });
  it('keeps foundations and the speed ladder as independent prerequisite paths', () => {
    expect(COURSE_LESSONS[0].prerequisiteId).toBeNull();
    for (let index = 1; index < 30; index++) expect(COURSE_LESSONS[index].prerequisiteId).toBe(COURSE_LESSONS[index - 1].id);
    expect(COURSE_LESSONS[30].prerequisiteId).toBeNull();
    expect(COURSE_LESSONS.slice(30).map(lesson => lesson.targetWpm)).toEqual([15, 25, 35, 45, 60, 80]);
    for (let index = 31; index < 36; index++) expect(COURSE_LESSONS[index].prerequisiteId).toBe(COURSE_LESSONS[index - 1].id);
  });
  it('builds deterministic catalog targets and isolates each variant comparison', () => {
    const a = buildCourseConfiguration('home-anchors', { ownerId: 'alice', clientSessionId: 'one', variantId: 'a' });
    const b = buildCourseConfiguration('home-anchors', { ownerId: 'bob', clientSessionId: 'two', variantId: 'a' });
    expect(a.initialTarget).toBe(b.initialTarget);
    expect(a.contentRevision).toBe('typing-course-v1:home-anchors:a');
    expect(a).toMatchObject({ mode: 'learn', scoringPolicy: 'prose', correctionPolicy: 'correct-words-locked', keyboardLayout: 'qwerty', language: 'en', inputMethod: 'keyboard' });
    expect(() => buildCourseConfiguration('missing', { ownerId: 'alice', clientSessionId: 'bad' })).toThrow('known');
    expect(() => buildCourseConfiguration('home-anchors', { ownerId: '', clientSessionId: 'bad' })).toThrow('workspace');
    expect(() => getCourseTarget(COURSE_LESSONS[0], 'bad' as CourseVariantId)).toThrow('variant');
  });
  it.each(COURSE_LESSONS)('replays all three genuine variants of $id into qualifying evidence', lesson => {
    for (const variant of lesson.variants) {
      const result = run(lesson.id, variant.id);
      const assessment = assessCourseResult(result)!;
      expect(assessment.qualifies, `${lesson.id}/${variant.id}: ${assessment.reasonCodes}`).toBe(true);
      expect(assessment.metrics.inputAccuracy).toBe(100);
      expect(assessment.version).toBe(COURSE_ASSESSMENT_VERSION);
      if (lesson.durationMs !== null) {
        expect(result.initialTarget.length).toBeGreaterThanOrEqual(2400);
        expect(result.initialTarget.startsWith(variant.text + ' ')).toBe(true);
        expect(result.finishReason).toBe('timeout');
      }
    }
  });
});

describe('canonical course assessment', () => {
  it('counts corrected insertion mistakes in accuracy while allowing a clean final passage', () => {
    const result = run('home-anchors', 'a', { mistakes: 1 });
    const assessment = assessCourseResult(result)!;
    expect(assessment.metrics.incorrectAttempts).toBe(1);
    expect(assessment.metrics.inputAccuracy).toBeCloseTo(100 * result.initialTarget.length / (result.initialTarget.length + 1));
    expect(assessment.metrics.finalTextAccuracy).toBe(100);
    expect(assessment.qualifies).toBe(true);
  });
  it('cannot repair poor input accuracy by deleting every mistake', () => {
    const result = run('home-anchors', 'a', { mistakes: 10 });
    const changed = copy(result); changed.metrics.inputAccuracy = 100; changed.metrics.incorrectAttempts = 0;
    const assessment = assessCourseResult(changed)!;
    expect(assessment.metrics.incorrectAttempts).toBe(10);
    expect(assessment.metrics.finalTextAccuracy).toBe(100);
    expect(assessment.checks.accuracy).toBe(false);
    expect(assessment.qualifies).toBe(false);
    expect(assessment.reasonCodes).toContain('accuracy');
  });
  it('does not accept skipped or unfinished final words', () => {
    const partial = run('home-anchors', 'a', { characters: 42, manual: true });
    expect(assessCourseResult(partial)!.checks.completed).toBe(false);
    let now = 0;
    const config = buildCourseConfiguration('home-anchors', { ownerId: 'alice', clientSessionId: 'skipped' });
    const session = new SessionController(config, { now: () => now, wallNow: () => origin + now });
    for (const char of config.initialTarget.slice(1)) { session.input({ type: 'insert', text: char }); now += 100; }
    expect(assessCourseResult(session.result ?? session.finish('manual'))!.qualifies).toBe(false);
  });
  it('permits a deliberate finite-lesson pause but never a paused speed qualification', () => {
    expect(assessCourseResult(run('home-anchors', 'a', { pause: true }))!.qualifies).toBe(true);
    const speed = assessCourseResult(run('speed-15', 'a', { pause: true }))!;
    expect(speed.checks.completed).toBe(false);
    expect(speed.qualifies).toBe(false);
  });
  it('requires the actual full speed deadline and its target pace', () => {
    expect(assessCourseResult(run('speed-15', 'a', { manual: true }))!.checks.completed).toBe(false);
    const slow = assessCourseResult(run('speed-80', 'a', { characters: 30 }))!;
    expect(slow.checks.completed).toBe(true);
    expect(slow.checks.speed).toBe(false);
    expect(slow.qualifies).toBe(false);
    expect(assessCourseResult(run('speed-15', 'a', { lateTick: true }))!.qualifies).toBe(true);
  });
  it('does not use rounded or missing displayed WPM as evidence', () => {
    const result = copy(run('speed-25', 'a', { characters: 62 }));
    result.metrics.wpm = 100;
    const assessment = assessCourseResult(result)!;
    expect(assessment.metrics.wpm).toBeCloseTo(24.8);
    expect(assessment.checks.speed).toBe(false);
    const zero = copy(result); zero.elapsedMs = 0;
    expect(assessCourseResult(zero)!.qualifies).toBe(false);
  });
  it('keeps bulk, composition and virtual input as unqualified practice', () => {
    expect(assessCourseResult(run('home-anchors', 'a', { bulk: true }))!.checks.unassisted).toBe(false);
    for (const inputMethod of ['composition', 'virtual']) {
      const result = copy(run()); result.configuration.inputMethod = inputMethod;
      const assessment = assessCourseResult(result)!;
      expect(assessment.inputMethod).toBe(inputMethod);
      expect(assessment.checks.configuration).toBe(false);
      expect(assessment.checks.unassisted).toBe(false);
      expect(assessment.qualifies).toBe(false);
    }
    for (const mark of ['0', 'group']) {
      const result = copy(run()); result.events[0].compositionId = mark;
      expect(assessCourseResult(result)!.checks.unassisted).toBe(false);
    }
  });
  it('does not allow a caller to relabel text, course identity or curriculum dimensions', () => {
    const result = copy(run()); result.configuration.initialTarget += 'x';
    expect(assessCourseResult(result)!.checks.configuration).toBe(false);
    for (const [key, value] of [['keyboardLayout', 'dvorak'], ['language', 'fr'], ['contentRevision', 'other'], ['rejectIncorrect', true]] as const) {
      const changed = copy(run()); Object.assign(changed.configuration, { [key]: value });
      expect(assessCourseResult(changed)!.qualifies).toBe(false);
    }
    const unknown = copy(run()); (unknown.configuration.settings!.course as { lessonId: string }).lessonId = 'unknown';
    expect(assessCourseResult(unknown)).toBeNull();
    const ordinary = copy(run()); delete ordinary.configuration.settings!.course;
    expect(assessCourseResult(ordinary)).toBeNull();
  });
  it('fails malformed timing/event evidence safely rather than retaining a passing label', () => {
    const result = copy(run()); result.events[1].sequence = 99;
    expect(assessCourseResult(result)!.qualifies).toBe(false);
    const reordered = copy(run()); reordered.events[1].offsetMs = -1;
    expect(assessCourseResult(reordered)!.qualifies).toBe(false);
    const empty = copy(run()); empty.events = [];
    expect(assessCourseResult(empty)!.qualifies).toBe(false);
  });
});

describe('owner-scoped progress from saved evidence', () => {
  it('starts with only the first foundation lesson and first speed rung available', () => {
    const progress = deriveCourseProgress([], 'alice');
    expect(progress.lessons.filter(item => item.unlocked).map(item => item.lessonId)).toEqual(['home-anchors', 'speed-15']);
    expect(progress.completedCount).toBe(0);
    expect(progress.continueLessonId).toBe('home-anchors');
  });
  it('requires two distinct qualifying variants, not two retries or duplicated IDs', () => {
    const a = record(run());
    const retry = record(run('home-anchors', 'a', { id: 'retry', startedAt: 10000 }));
    const one = deriveCourseProgress([a, a, retry], 'alice');
    expect(one.byLessonId['home-anchors']).toMatchObject({ completed: false, qualificationCount: 1, attempts: 2, nextVariantId: 'b' });
    expect(one.byLessonId['home-middle'].unlocked).toBe(false);
    const two = deriveCourseProgress([a, retry, record(run('home-anchors', 'b', { startedAt: 20000 }))], 'alice');
    expect(two.byLessonId['home-anchors'].completed).toBe(true);
    expect(two.byLessonId['home-middle'].unlocked).toBe(true);
  });
  it('lets speed progress independently of the foundation sequence', () => {
    const progress = deriveCourseProgress([record(run('speed-15', 'a')), record(run('speed-15', 'b', { startedAt: 40000 }))], 'alice');
    expect(progress.speedCompletedCount).toBe(1);
    expect(progress.foundationCompletedCount).toBe(0);
    expect(progress.byLessonId['speed-25'].unlocked).toBe(true);
    expect(progress.byLessonId['home-middle'].unlocked).toBe(false);
  });
  it('does not count successful attempts made before their prerequisite was completed', () => {
    const early = [record(run('home-middle', 'a')), record(run('home-middle', 'b'))];
    const foundation = [record(run('home-anchors', 'a', { startedAt: 30000 })), record(run('home-anchors', 'b', { startedAt: 40000 }))];
    const progress = deriveCourseProgress([...early, ...foundation], 'alice');
    expect(progress.byLessonId['home-middle']).toMatchObject({ unlocked: true, completed: false, qualificationCount: 0, attempts: 2 });
  });
  it('filters other owners, legacy imports, guest imports, rejected uploads and wrong layout', () => {
    const valid = record(run());
    const mixed = [record(run('home-anchors', 'b', { ownerId: 'bob' })),
      { ...valid, provenance: 'legacy' as const }, { ...valid, provenance: 'guest-import' as const },
      { ...valid, state: 'rejected' as const }, { ...valid, payloadVersion: 'legacy-unverified' }];
    expect(deriveCourseProgress(mixed, 'alice').byLessonId['home-anchors'].attempts).toBe(0);
    const malformed = { ...valid, candidate: undefined, courseEvidence: { ...valid.courseEvidence!, layout: 'dvorak' } as unknown as CourseAssessment };
    expect(deriveCourseProgress([malformed], 'alice').completedCount).toBe(0);
  });
  it('uses the accepted server projection authoritatively, including failed practice', () => {
    const valid = record(run());
    const failed = copy(valid.courseEvidence!); failed.qualifies = false; failed.checks.accuracy = false; failed.reasonCodes = ['accuracy'];
    expect(deriveCourseProgress([{ ...valid, accepted: { course: failed } }], 'alice').byLessonId['home-anchors'].qualificationCount).toBe(0);
    expect(deriveCourseProgress([{ ...valid, accepted: { course: null } }], 'alice').byLessonId['home-anchors'].attempts).toBe(0);
  });
  it('restores progress from accepted summaries without raw replay on a second device', () => {
    const records = ['a', 'b'].map(variant => {
      const result = run('home-anchors', variant as CourseVariantId);
      return record(result, { candidate: undefined, courseEvidence: undefined, accepted: { course: assessCourseResult(result) }, state: 'synced' });
    });
    expect(deriveCourseProgress(records, 'alice').byLessonId['home-anchors'].completed).toBe(true);
  });
  it('retains local course summaries after replay expiry without fabricating a server badge', async () => {
    const repository = new SessionRepository();
    for (const variant of ['a', 'b'] as const) await repository.save(record(run('home-anchors', variant), { evidenceExpiresAt: 1 }));
    await repository.expireEvidence(2);
    const records = await repository.list('alice');
    expect(records.every(item => item.candidate === undefined && item.accepted === undefined && item.courseEvidence)).toBe(true);
    expect(deriveCourseProgress(records, 'alice').byLessonId['home-anchors'].completed).toBe(true);
  });
  it('never resurrects a rejected course checkpoint when its canonical replay expires', async () => {
    const repository = new SessionRepository();
    const a = record(run('home-anchors', 'a'), { evidenceExpiresAt: 1 });
    const rejected = record(run('home-anchors', 'b'), { evidenceExpiresAt: 1, state: 'rejected', errorCode: 'validation', message: 'Server validation rejected this attempt.' });
    expect(a.courseEvidence?.qualifies).toBe(true);
    expect(rejected.courseEvidence?.qualifies).toBe(true);
    await repository.save(a); await repository.save(rejected);
    expect(deriveCourseProgress(await repository.list('alice'), 'alice').byLessonId['home-anchors'].qualificationCount).toBe(1);
    await repository.expireEvidence(2);
    const rows = await repository.list('alice');
    expect(rows.every(row => row.candidate === undefined && row.courseEvidence?.qualifies)).toBe(true);
    expect(await repository.get('alice', rejected.clientSessionId)).toMatchObject({ state: 'rejected', errorCode: 'validation', message: 'Server validation rejected this attempt.' });
    const progress = deriveCourseProgress(rows, 'alice');
    expect(progress.byLessonId['home-anchors']).toMatchObject({ attempts: 1, qualificationCount: 1, completed: false });
    expect(progress.byLessonId['home-middle'].unlocked).toBe(false);
  });
  it('recomputes completion when a qualifying session is deleted', () => {
    const records = [record(run('home-anchors', 'a')), record(run('home-anchors', 'b'))];
    expect(deriveCourseProgress(records, 'alice').byLessonId['home-middle'].unlocked).toBe(true);
    expect(deriveCourseProgress(records.slice(0, 1), 'alice').byLessonId['home-anchors'].qualificationCount).toBe(1);
    expect(deriveCourseProgress(records.slice(0, 1), 'alice').byLessonId['home-middle'].unlocked).toBe(false);
  });
  it('does not trust forged retained completion flags or numerical evidence', () => {
    const saved = record(run()); delete saved.candidate;
    const fake = copy(saved.courseEvidence!); fake.metrics.inputAccuracy = null;
    expect(deriveCourseProgress([{ ...saved, courseEvidence: fake }], 'alice').byLessonId['home-anchors'].attempts).toBe(0);
    const badReasons = copy(saved.courseEvidence!); badReasons.reasonCodes = ['accuracy'];
    expect(deriveCourseProgress([{ ...saved, courseEvidence: badReasons }], 'alice').byLessonId['home-anchors'].attempts).toBe(0);
  });
});
