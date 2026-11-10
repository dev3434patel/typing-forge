import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { SessionController as Baseline } from '../2026-11-04-followup/core-cache-baseline/session.ts';
import { SessionController as Candidate } from '../2026-11-04-followup/core-cache-combinedCache/session.ts';

const prefix = 'audit/2026-11-05-followup/checkpoint-differential';
const hash = value => createHash('sha256').update(value).digest('hex');
const targets = [
  '', 'cat dog sun', 'é e\u0301 क्षि 👩‍💻 عربي עברית', 'a\r\nb\tc',
  'a'.repeat(4096), 'b'.repeat(4097), 'c'.repeat(8192), 'd'.repeat(8193),
  Array(512).fill('a').join(' '), Array(513).fill('b').join(' '),
  Array(800).fill('practice').join(' '), Array(1024).fill('c').join(' '),
  Array(1025).fill('d').join(' '), ' '.repeat(1023), ' '.repeat(1024),
];
const modes = [
  { mode: 'time', scoringPolicy: 'prose', durationMs: 15000, correctionPolicy: 'correct-words-locked' },
  { mode: 'words', scoringPolicy: 'prose', correctionPolicy: 'current-word' },
  { mode: 'code', scoringPolicy: 'code', codeLanguage: 'typescript' },
  { mode: 'zen', scoringPolicy: 'free' },
  { mode: 'race', scoringPolicy: 'prose', durationMs: 30000, correctionPolicy: 'current-word', challengeId: 'arena:parity' },
];
const inputs = ['src/lib/typing-core/session.ts', 'src/lib/typing-core/transcript.ts', 'audit/2026-11-04-followup/core-cache-baseline/session.ts', 'audit/2026-11-04-followup/core-cache-baseline/transcript.ts', 'audit/2026-11-04-followup/core-cache-combinedCache/session.ts', 'audit/2026-11-04-followup/core-cache-combinedCache/transcript.ts'];
const before = Object.fromEntries(await Promise.all(inputs.map(async file => [file, hash(await readFile(file))])));
const protocol = { declaredAt: new Date().toISOString(), scope: 'Pure audit-clone differential, not browser/HTTP acceptance. All complete JSON property order, errors, post-edit state, frozen results and retained publications compared.', cases: targets.length * modes.length * 2, deterministicSeed: 'target-index/mode-index/rejection-flag', operationsPerCase: 30, inputs: before, retries: 0 };
await writeFile(`${prefix}-protocol.json`, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const rows = [];
function exercise(Class, configuration) {
  let now = 100, wall = 1793815200000;
  const controller = new Class(configuration, { now: () => now, wallNow: () => wall });
  if (configuration.mode === 'race') controller.startAt(now, wall);
  const outputs = [], publications = [];
  let calls = 0, errors = 0;
  const invoke = (label, operation) => {
    calls++;
    try { outputs.push([label, JSON.stringify(operation())]); }
    catch (error) { errors++; outputs.push([label, error.name, error.message]); }
    outputs.push(['after', JSON.stringify(controller.snapshot())]);
  };
  invoke('ready-checkpoint', () => controller.checkpoint());
  const characters = ['c', 'a', 'x', ' ', 'é', '👩‍💻', '\n', '\t', 'क्‍ष'];
  for (let index = 0; index < 30; index++) {
    now += index % 9 === 0 ? 0 : 63 + index % 5;
    wall += 63 + index % 5;
    if (index === 6) invoke('pause', () => controller.pause());
    if (index === 7) invoke('paused-input', () => controller.input({ type: 'insert', text: 'x' }));
    if (index === 8) invoke('resume', () => controller.resume());
    const text = characters[index % characters.length];
    const edits = [
      { type: 'insert', text }, { type: 'delete' }, { type: 'reject', text: 'x' },
      { type: 'composition', text: 'é', compositionId: `composition-${index}` },
      { type: 'replace', text, provenance: 'autocorrect' },
      { type: 'submit', text: '' }, { type: 'insert', text: ' ', start: 0, end: 0 },
      { type: 'insert', text, start: -1, end: 0 },
    ];
    invoke(`edit-${index}`, () => controller.input(edits[index % edits.length]));
    if (index % 5 === 0) invoke(`checkpoint-${index}`, () => {
      const result = controller.checkpoint();
      assert.ok(Object.isFrozen(result) && Object.isFrozen(result.characters) && result.characters.every(Object.isFrozen));
      assert.ok(Object.isFrozen(result.events) && Object.isFrozen(result.timeSeries) && Object.isFrozen(result.configuration));
      publications.push([result, JSON.stringify(result)]);
      return result;
    });
    if (index === 12 && ['time', 'zen'].includes(configuration.mode)) invoke('append', () => controller.appendTarget(' more text'));
  }
  now += 20000; wall += 20000;
  invoke('deadline-tick', () => controller.tick());
  invoke('final', () => controller.finish('manual'));
  for (const [result, json] of publications) assert.equal(JSON.stringify(result), json, 'Later edits must not mutate a published checkpoint.');
  return { outputs, calls, errors, publications: publications.length };
}
for (const [targetIndex, target] of targets.entries()) for (const [modeIndex, mode] of modes.entries()) for (const rejectIncorrect of [false, true]) {
  const config = { ...mode, clientSessionId: `diff-${targetIndex}-${modeIndex}-${rejectIncorrect}`, initialTarget: target, ownerScope: 'guest', rejectIncorrect, inputMethod: 'keyboard-or-composition', language: targetIndex === 2 ? 'hi' : 'en', keyboardLayout: 'qwerty', contentRevision: 'audit-parity', settings: { nested: { preserve: ['order', 1, true, null] } } };
  const baseline = exercise(Baseline, config), candidate = exercise(Candidate, config);
  assert.deepEqual(candidate, baseline);
  rows.push({ targetIndex, targetUtf16Units: target.length, mode: mode.mode, rejectIncorrect, calls: candidate.calls, errors: candidate.errors, publications: candidate.publications, observations: candidate.outputs.length, resultSha256: hash(JSON.stringify(candidate.outputs)), exact: true });
}
for (const file of inputs) assert.equal(hash(await readFile(file)), before[file]);
const result = { ...protocol, completedAt: new Date().toISOString(), status: 'PASS-SCOPED-DIFFERENTIAL', exactCases: rows.length, callsPerVariant: rows.reduce((sum, row) => sum + row.calls, 0), errorsPerVariant: rows.reduce((sum, row) => sum + row.errors, 0), inputHashesUnchanged: true, rows };
await writeFile(`${prefix}-result.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, exactCases: result.exactCases, callsPerVariant: result.callsPerVariant, errorsPerVariant: result.errorsPerVariant }));
