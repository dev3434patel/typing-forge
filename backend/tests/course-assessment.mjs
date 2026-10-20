import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Pure canonical TS -> native PHP acceptance; no database or HTTP service used.
const root = path.resolve(import.meta.dirname, '../..');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'sparowtype-course-'));
const catalog = JSON.parse(await readFile(path.join(root, 'backend/resources/typing-course-v1.json'), 'utf8'));
const owner = '11111111-1111-4111-8111-111111111111';
const cases = [];
let sequence = 0;
try {
  for (const name of ['types', 'transcript', 'metrics', 'session']) {
    const source = (await readFile(path.join(root, `src/lib/typing-core/${name}.ts`), 'utf8')).replace(/from ['"]\.\/(types|transcript|metrics|session)\.ts['"]/g, (_, target) => `from './${target}.mjs'`);
    await writeFile(path.join(temporary, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  }
  const { SessionController } = await import(pathToFileURL(path.join(temporary, 'session.mjs')));
  const courseSource = (await readFile(path.join(root, 'src/lib/typing-course.ts'), 'utf8'))
    .replace(/import catalog from ['"][^'"]+\.json['"];?/, `const catalog = ${JSON.stringify(catalog)};`)
    .replace(/from ['"]\.\/typing-core\/(types|transcript|metrics|session)['"]/g, (_, target) => `from './${target}.mjs'`);
  await writeFile(path.join(temporary, 'typing-course.mjs'), ts.transpileModule(courseSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  const { buildCourseConfiguration, assessCourseResult } = await import(pathToFileURL(path.join(temporary, 'typing-course.mjs')));
  const targetFor = (lesson, variant) => { let text = variant.text; if (lesson.durationMs !== null) while (text.length < 2400) text += ' ' + variant.text; return text; };
  function create(lesson, variant, changes = {}) {
    const target = targetFor(lesson, variant);
    let now = 0, started = null;
    const controller = new SessionController({ ...buildCourseConfiguration(lesson.id, { ownerId: owner, clientSessionId: `native-course-${++sequence}`, variantId: variant.id }), ...changes }, { now: () => now, wallNow: () => 1_792_510_000_000 + now });
    const input = (text, delay = 100, options = {}) => {
      now += delay; if (started === null) started = now;
      if (!controller.result) controller.input({ type: 'insert', text, ...options });
    };
    const finish = () => {
      if (lesson.durationMs !== null && !controller.result) { now = (started ?? now) + lesson.durationMs + controller.snapshot().wallDurationMs - controller.snapshot().elapsedMs; controller.tick(); }
      return structuredClone(controller.result ?? controller.finish('manual'));
    };
    return { controller, target, input, finish, advance(ms) { now += ms; }, get now() { return now; } };
  }
  function capture(name, item, qualifies, extra = {}) {
    const candidate = item.finish();
    cases.push({ name, candidate, owner, consent: false, qualifies, ...extra });
    return candidate;
  }
  function fill(item, lesson, variant) {
    const count = lesson.durationMs === null ? item.target.length : Math.ceil(lesson.targetWpm * 2.5) + 25;
    const delay = lesson.durationMs === null ? Math.max(100, Math.ceil(lesson.minDurationMs / Math.max(1, item.target.length - 1)) + 1) : 100;
    for (const text of item.target.slice(0, count)) item.input(text, delay);
  }
  for (const lesson of catalog.lessons) for (const variant of lesson.variants) {
    const item = create(lesson, variant); fill(item, lesson, variant);
    capture(`catalog:${lesson.id}:${variant.id}`, item, true);
  }
  const finite = catalog.lessons.find(lesson => lesson.durationMs === null);
  const timed = catalog.lessons.find(lesson => lesson.durationMs !== null);
  const variant = finite.variants[0];
  {
    const item = create(finite, variant, { correctionPolicy: 'current-word' });
    fill(item, finite, variant);
    capture('historical-current-word-course-still-qualifies', item, true);
  }
  {
    const item = create(finite, variant, { correctionPolicy: 'correct-words-locked' });
    fill(item, finite, variant);
    capture('correct-word-locked-course-qualifies-in-separate-cohort', item, true);
  }
  assert.notEqual(
    cases.find(item => item.name === 'historical-current-word-course-still-qualifies').candidate.comparisonKey,
    cases.find(item => item.name === 'correct-word-locked-course-qualifies-in-separate-cohort').candidate.comparisonKey,
    'Historical and correct-word-locked course results must retain distinct comparison cohorts.',
  );
  {
    const item = create(finite, variant, { correctionPolicy: 'correct-words-locked' });
    const firstWord = item.target.split(' ')[0];
    for (const text of (firstWord[0] === 'x' ? 'z' : 'x') + firstWord.slice(1) + ' ') item.input(text);
    item.advance(100); item.controller.input({ type: 'delete' });
    item.advance(100); item.controller.input({ type: 'delete', start: 0, end: firstWord.length });
    fill(item, finite, variant);
    const result = capture('course-reopened-incorrect-word-retains-attempt-accuracy', item, true);
    assert.ok(result.metrics.inputAccuracy < 100);
    assert.equal(result.metrics.finalTextAccuracy, 100);
  }
  {
    const item = create(finite, variant); const wrong = item.target[0] === 'x' ? 'z' : 'x';
    item.input(wrong); item.advance(100); item.controller.input({ type: 'delete', text: '', start: 0, end: 1 });
    fill(item, finite, variant);
    const result = capture('corrected-error-stays-in-accuracy', item, true);
    assert.ok(result.metrics.inputAccuracy < 100); assert.equal(result.metrics.finalTextAccuracy, 100);
  }
  {
    const item = create(finite, variant);
    for (let index = 0; index < 10; index++) { item.input('x'); item.advance(100); item.controller.input({ type: 'delete', text: '', start: 0, end: 1 }); }
    fill(item, finite, variant); capture('low-input-accuracy-is-recorded-not-passed', item, false, { failedCheck: 'accuracy' });
  }
  {
    const item = create(finite, variant); item.input(item.target[0]); item.advance(finite.minDurationMs + 100);
    item.input(item.target.slice(1)); capture('keyboard-labelled-bulk-is-practice-only', item, false, { failedCheck: 'unassisted' });
  }
  {
    const item = create(finite, variant, { inputMethod: 'composition' }); item.input(item.target[0], 100, { type: 'composition', provenance: 'composition', compositionId: 'first' });
    item.advance(finite.minDurationMs + 100); item.input(item.target.slice(1), 100, { type: 'composition', provenance: 'composition', compositionId: 'rest' });
    capture('composition-recorded-with-actual-method', item, false, { failedCheck: 'configuration', actualMethod: 'composition' });
  }
  {
    const item = create(finite, variant, { inputMethod: 'virtual' }); fill(item, finite, variant);
    capture('virtual-recorded-with-actual-method', item, false, { failedCheck: 'unassisted', actualMethod: 'virtual' });
  }
  {
    const item = create(finite, variant); item.input(item.target[0]); item.advance(1); item.controller.pause(); item.advance(1200); item.controller.resume();
    for (const text of item.target.slice(1)) item.input(text, 150);
    capture('finite-accuracy-practice-can-pause', item, true);
  }
  {
    const item = create(timed, timed.variants[0]); item.input(item.target[0]); item.advance(1); item.controller.pause(); item.advance(1200); item.controller.resume();
    for (const text of item.target.slice(1, 80)) item.input(text);
    capture('speed-pause-cannot-qualify', item, false, { failedCheck: 'completed' });
  }
  {
    const item = create(finite, variant); item.input(item.target[0]);
    capture('manual-partial-retains-practice-only', item, false, { failedCheck: 'completed' });
  }
  {
    const item = create(finite, variant); for (const text of item.target.slice(0, -1)) item.input(text, 150);
    item.input(item.target.at(-1) === 'x' ? 'z' : 'x'); capture('processed-wrong-final-character-is-not-completion', item, false, { failedCheck: 'completed' });
  }
  {
    const item = create(timed, timed.variants[0]); for (const text of item.target.slice(0, 12)) item.input(text);
    capture('speed-low-evidence-and-rate-do-not-qualify', item, false, { failedCheck: 'evidence' });
  }
  const good = cases[0];
  function reject(name, mutate) { const value = structuredClone(good); value.name = name; value.reject = true; mutate(value.candidate); cases.push(value); }
  reject('reject-unknown-course', value => value.configuration.settings.course.courseId = 'unknown');
  reject('reject-unknown-assessment', value => value.configuration.settings.course.assessmentVersion = 'unknown');
  reject('reject-unknown-lesson', value => value.configuration.settings.course.lessonId = 'missing-lesson');
  reject('reject-unknown-variant', value => value.configuration.settings.course.variantId = 'd');
  reject('reject-client-passed-metadata', value => value.configuration.settings.course.qualifies = true);
  reject('reject-client-threshold-settings', value => value.configuration.settings.minAccuracy = 0);
  reject('reject-null-course-metadata', value => value.configuration.settings.course = null);
  reject('reject-array-course-metadata', value => value.configuration.settings.course = []);
  reject('reject-altered-target', value => value.configuration.initialTarget += 'x');
  reject('reject-wrong-layout', value => value.configuration.keyboardLayout = 'dvorak');
  reject('reject-wrong-language', value => value.configuration.language = 'fr');
  reject('reject-shared-content-cohort', value => value.configuration.contentRevision = 'typing-course-v1');
  reject('reject-extra-word-cohort-dimension', value => value.configuration.wordCount = 1);
  reject('reject-generated-course-seed', value => value.configuration.seed = 'different');
  reject('reject-course-challenge-shortcut', value => value.configuration.challengeId = 'forged');
  reject('reject-cross-owner-course', value => value.ownerScope = '22222222-2222-4222-8222-222222222222');
  reject('reject-false-canonical-course-metrics', value => value.metrics.inputAccuracy = 0);
  {
    const value = structuredClone(cases.find(item => item.name === 'low-input-accuracy-is-recorded-not-passed'));
    value.name = 'ignored-top-level-course-qualification-claim'; value.candidate.course = { qualifies: true }; cases.push(value);
  }
  assert.notEqual(cases[0].candidate.comparisonKey, cases[1].candidate.comparisonKey, 'Course variants must have distinct comparison cohorts.');
  const runtime = phpRuntime();
  const result = spawnSync(runtime.binary, [...runtime.args, path.join(import.meta.dirname, 'replay-driver.php')], { cwd: root, input: JSON.stringify(cases), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, 'Native PHP replay fixture failed.');
  const received = JSON.parse(result.stdout);
  const failures = [];
  function compare(expected, actual, label) {
    if (typeof expected === 'number' && typeof actual === 'number') { assert.ok(Math.abs(expected - actual) <= Math.max(1e-9, Math.abs(expected) * 1e-12), label); return; }
    if (expected && typeof expected === 'object') {
      assert.equal(Array.isArray(actual), Array.isArray(expected), label);
      assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${label} keys`);
      for (const key of Object.keys(expected)) compare(expected[key], actual[key], `${label}.${key}`);
    } else assert.equal(actual, expected, label);
  }
  for (let index = 0; index < cases.length; index++) {
    const fixture = cases[index], actual = received[index];
    try {
      if (fixture.reject) { assert.equal(actual.ok, false, 'Untrusted metadata/configuration must reject.'); assert.equal(actual.class, 'InvalidArgumentException'); continue; }
      assert.equal(actual.ok, true, actual.message);
      assert.equal(actual.result.course.qualifies, fixture.qualifies);
      assert.equal(actual.result.course.ownerId, owner);
      assert.equal(actual.result.course.sessionId, fixture.candidate.clientSessionId);
      assert.equal(actual.result.course.metrics.inputAccuracy, actual.result.metrics.inputAccuracy);
      assert.equal(actual.result.course.metrics.incorrectAttempts, actual.result.metrics.incorrectAttempts);
      assert.equal(actual.result.learningEvidence.assessment, false, 'Course work cannot grant adaptive mastery checkpoints.');
      if (fixture.failedCheck) assert.equal(actual.result.course.checks[fixture.failedCheck], false);
      if (fixture.actualMethod) assert.equal(actual.result.course.inputMethod, fixture.actualMethod);
      compare(assessCourseResult(fixture.candidate), actual.result.course, fixture.name);
    } catch (error) { failures.push({ case: fixture.name, message: error.message }); }
  }
  const sourceHashes = {};
  for (const file of ['backend/resources/typing-course-v1.json','src/lib/typing-course.ts','backend/src/CourseAssessment.php','backend/src/SessionValidator.php']) sourceHashes[file] = createHash('sha256').update(await readFile(path.join(root,file))).digest('hex');
  const report = { date: new Date().toISOString(), scope: 'Pure canonical browser-session -> native PHP replay, without HTTP/database mutations',
    catalogLessons: catalog.lessons.length, originalVariants: catalog.lessons.reduce((sum, lesson) => sum + lesson.variants.length, 0),
    cases: cases.length, acceptedCases: cases.filter(item => !item.reject).length, rejectionCases: cases.filter(item => item.reject).length,
    failures, passed: failures.length === 0, sourceHashes, automatedInputProofClaimed: false };
  const reportFile = process.env.SPAROWTYPE_COURSE_TEST_REPORT || path.join(root, 'audit/learning-upgrade-2026-10-20/php-course-assessment.json');
  await mkdir(path.dirname(reportFile), { recursive: true }); await writeFile(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  assert.equal(failures.length, 0, 'Every course variant and assessment boundary must pass native replay acceptance.');
} finally { await rm(temporary, { recursive: true, force: true }); }
