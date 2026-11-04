import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../..');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'sparowtype-parity-'));
try {
  // Compile the actual portable implementation, not a second JS scoring model.
  for (const name of ['types', 'transcript', 'metrics', 'session', 'learning-evidence', 'validation']) {
    const sourcePath = name === 'validation' ? 'supabase/functions/_shared/validation.ts' : name === 'learning-evidence' ? 'src/lib/learning-evidence.ts' : `src/lib/typing-core/${name}.ts`;
    const source = (await readFile(path.join(root, sourcePath), 'utf8')).replace(/from ['"][^'"]*\/(types|transcript|metrics|session|learning-evidence)\.ts['"]/g, (_, target) => `from './${target}.mjs'`);
    const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
    await writeFile(path.join(temporary, `${name}.mjs`), output);
  }
  const { SessionController } = await import(pathToFileURL(path.join(temporary, 'session.mjs')));
  const { graphemes } = await import(pathToFileURL(path.join(temporary, 'transcript.mjs')));
  const { validateCandidate } = await import(pathToFileURL(path.join(temporary, 'validation.mjs')));
  const { learningEvidenceFromResult } = await import(pathToFileURL(path.join(temporary, 'learning-evidence.mjs')));
  const arenaSource = await readFile(path.join(root, 'src/domain/arena.ts'), 'utf8');
  await writeFile(path.join(temporary, 'arena.mjs'), ts.transpileModule(arenaSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  const { arenaEvidencePayload } = await import(pathToFileURL(path.join(temporary, 'arena.mjs')));
  const cases = [];
  const owner = '11111111-1111-4111-8111-111111111111';
  let serial = 0;
  function create(config = {}) {
    let now = 0;
    const controller = new SessionController({ clientSessionId: `php-parity-${++serial}`, ownerScope: owner, mode: 'words', initialTarget: 'cat dog fox', correctionPolicy: 'current-word', ...config }, { now: () => now, wallNow: () => 1792400000000 + now });
    return { controller, advance: (delta) => { now += delta; }, input: (edit, delay = 83.25) => { now += delay; if (!controller.result) controller.input(edit); }, get now() { return now; } };
  }
  function save(name, item, options = {}) {
    const candidate = structuredClone(item.controller.result ?? item.controller.finish());
    cases.push({ name, candidate, owner, consent: true, ...options });
    return candidate;
  }
  for (const [name, text, policy, language] of [
    ['latin', 'café naïve cat', 'prose', 'fr'], ['nfc', 'e\u0301 cole', 'prose', 'fr'],
    ['arabic', 'مرحبا بالعالم', 'prose', 'ar'], ['devanagari', 'क्ष ज्ञ त्र क्‍ष श्र र्क', 'prose', 'hi'],
    ['gujarati', 'ક્ષ જ્ઞ શ્ર', 'prose', 'gu-Latn'], ['bengali', 'ক্ষ জ্ঞ শ্র', 'prose', 'bn'],
    ['mixed-virama-bases', 'a\u094d\u0915 \u094d\u0915 a\u09cd\u0995 क\u200c्क क्\u200cक', 'prose', 'hi'],
    ['emoji', '👨‍👩‍👧‍👦 🇮🇳 👍🏽 a', 'prose', 'en'], ['code', 'let a = 1;\n\treturn a;\n', 'code', 'en'],
    ['free', 'a\n\tb 👩‍💻', 'free', 'en'], ['extra', 'cat dog fox', 'prose', 'en'],
  ]) {
    const item = create({ mode: policy === 'code' ? 'code' : policy === 'free' ? 'zen' : 'learn', initialTarget: text, scoringPolicy: policy, language });
    for (const unit of graphemes(text)) item.input({ type: 'insert', text: unit });
    item.advance(6500); save(name, item);
  }
  {
    const text = Array.from({length: 60}, (_, i) => String(i)).join(' ') + ' 0 1 2';
    const item = create({mode:'code', scoringPolicy:'code', initialTarget:text});
    for (const unit of graphemes(text)) item.input({type:'insert',text:unit});
    save('numeric-cache-eviction', item);
  }
  {
    const item = create(); item.input({ type: 'insert', text: 'c' }); item.input({ type: 'insert', text: 'x' });
    item.input({ type: 'delete', start: 1, end: 2, text: '' }); item.input({ type: 'insert', text: 'at dog fox' }); item.advance(5500); save('corrected-errors-and-batch', item);
  }
  {
    const item = create({ rejectIncorrect: true }); item.input({ type: 'insert', text: 'x' });
    for (const text of ['c', 'a', 't', ' ', 'd', 'o', 'g', ' ', 'f', 'o', 'x']) item.input({ type: 'insert', text });
    save('stop-on-error-attempts', item);
  }
  {
    const item = create({ inputMethod: 'composition' }); item.input({ type: 'composition', text: 'cat', provenance: 'composition', compositionId: 'one' }); item.input({ type: 'composition', text: 'cat', provenance: 'composition', compositionId: 'one' });
    item.input({ type: 'insert', text: ' dog fox' }); save('composition-identity', item);
  }
  {
    const item = create({inputMethod:'composition'});
    item.input({type:'composition',text:'c',provenance:'composition',compositionId:'0'});
    item.input({type:'composition',text:'c',provenance:'composition',compositionId:'0'});
    item.input({type:'insert',text:'at dog fox'}); save('zero-composition-id',item);
  }
  {
    const item = create(); item.input({ type: 'insert', text: 'c' }); item.advance(300); item.controller.pause(); item.advance(2000); item.controller.resume();
    item.input({ type: 'insert', text: 'at dog fox' }); item.advance(1000); save('pause-latency', item);
  }
  for (const prefix of ['c', 'ca', 'cat']) {
    const item = create({ mode: 'time', durationMs: 30000 });
    for (const unit of prefix) item.input({ type: 'insert', text: unit }, 0);
    item.controller.pause(); item.advance(2000); item.controller.resume();
    item.input({ type: 'insert', text: ' ' }, 0); item.advance(6000);
    const candidate = save(`coarse-clock-pause-${prefix.length}`, item);
    for (const anchor of [-1, .5, 999]) {
      const forged = structuredClone(candidate); forged.clientSessionId += `-anchor-${String(anchor).replace('.', '_')}`; forged.configuration.clientSessionId = forged.clientSessionId; forged.pauseIntervals[0].afterSequence = anchor;
      cases.push({ name: `coarse-clock-invalid-anchor-${prefix.length}-${anchor}`, candidate: forged, owner, consent: true, reject: true });
    }
  }
  {
    const item = create({ mode: 'time', durationMs: 30000 }); item.input({ type: 'insert', text: 'c' }, 0); item.controller.pause(); item.advance(2000); save('coarse-clock-finish-while-paused', item);
  }
  {
    const item = create({ mode: 'time', durationMs: 15000, initialTarget: 'cat' });
    item.input({ type: 'insert', text: 'cat' }); item.controller.appendTarget(' dog'); item.input({ type: 'insert', text: ' dog' }); item.advance(15000); item.controller.tick(); save('ordered-target-extension', item);
  }
  {
    const item = create({ mode: 'zen', initialTarget: 'cat' }); item.input({ type: 'insert', text: 'catx' }); item.controller.appendTarget(' dog'); item.input({ type: 'insert', text: ' dog' }); item.advance(6000); save('late-target-extension', item);
  }
  {
    const item = create({ correctionPolicy: undefined }); item.input({ type: 'insert', text: 'cat ' }); item.input({ type: 'replace', start: 0, end: 4, text: 'dog ' }); item.advance(6000); save('legacy-prefix-replacement', item);
  }
  {
    const item = create({ correctionPolicy: undefined }); item.input({ type: 'insert', text: 'c' }); item.input({ type: 'submit', start: 1, end: 1, text: '' }); item.input({ type: 'insert', text: 'dog' }); item.advance(5000); save('noninserting-submit', item);
  }
  {
    const item = create({ mode: 'race', startImmediately: true }); item.input({ type: 'insert', text: 'c' }); item.advance(2500); save('interim-race', { controller: { result: item.controller.checkpoint() } }, { interim: true });
  }
  save('unstarted-abandoned', create());
  for (const text of ['\u0085', '\u180e']) {
    for (const policy of ['code', 'free']) {
      const item = create({mode:policy === 'code' ? 'code' : 'zen',scoringPolicy:policy,initialTarget:`a${text}z`});
      item.input({type:'insert',text:'a'});item.input({type:'insert',text});
      item.input({type:'delete',start:1,end:2,text:''});item.advance(6000);
      save(`editable-non-ecma-whitespace-${text.codePointAt(0)}-${policy}`,item);
    }
  }
  // New optional policy has distinct cohorts; historical current-word and
  // unrestricted fixtures above must retain exactly their original replay.
  const correctionCases = new Map();
  function correction(name, text, exercise, expected, overrides = {}) {
    const item = create({ mode: 'time', durationMs: 30000, correctionPolicy: 'correct-words-locked', ...overrides });
    for (const unit of graphemes(text)) item.input({ type: 'insert', text: unit });
    exercise(item);
    assert.equal(item.controller.currentText, expected, `${name}: portable retained transcript`);
    item.advance(6000);
    correctionCases.set(name, save(name, item));
  }
  correction('correct-word-remains-locked', 'cat ', item => item.input({ type: 'delete' }), 'cat ');
  correction('incorrect-word-reopens-retaining-text', 'cxt ', item => item.input({ type: 'delete' }), 'cxt');
  correction('short-word-reopens', 'c ', item => item.input({ type: 'delete' }), 'c');
  correction('skipped-word-reopens', ' ', item => item.input({ type: 'delete' }), '');
  correction('extra-word-character-reopens', 'cats ', item => item.input({ type: 'delete' }), 'cats');
  correction('extra-space-beyond-last-target-is-not-a-correct-submission', 'cat ', item => item.input({ type: 'delete' }), 'cat', { initialTarget: 'cat' });
  correction('empty-word-whole-delete-clamps-to-one-previous-word', 'cat cxt ', item => item.input({ type: 'delete', start: 0, end: 8 }), 'cat ');
  correction('nonempty-active-word-delete-cannot-cross-back', 'cat cxt dog', item => item.input({ type: 'delete', start: 0, end: 11 }), 'cat cxt ');
  correction('consecutive-errors-reopen-one-word-at-a-time', 'cxt dyg ', item => {
    item.input({ type: 'delete' });
    item.input({ type: 'delete', start: 0, end: 7 });
    assert.equal(item.controller.currentText, 'cxt ');
    item.input({ type: 'delete' });
  }, 'cxt');
  correction('correct-word-seals-older-incorrect-prefix', 'cxt dog ', item => item.input({ type: 'delete', start: 0, end: 8 }), 'cxt dog ');
  correction('corrected-before-submission-word-locks', 'cxt', item => {
    item.input({ type: 'replace', start: 1, end: 2, text: 'a' });
    item.input({ type: 'insert', text: ' ' });
    item.input({ type: 'delete' });
  }, 'cat ');
  correction('previous-incorrect-word-replacement-still-blocked', 'cat cxt ', item => item.input({ type: 'replace', start: 4, end: 8, text: 'dog ' }), 'cat cxt ');
  correction('virtual-incorrect-submission-reopens-without-character-loss', 'c', item => {
    item.input({ type: 'submit' }); item.input({ type: 'delete', start: 1, end: 1 });
  }, 'c');
  correction('virtual-incorrect-submission-whole-delete-clears-word', 'c', item => {
    item.input({ type: 'submit' }); item.input({ type: 'delete', start: 0, end: 1 });
  }, '');
  correction('virtual-correct-submission-remains-locked', 'cat', item => {
    item.input({ type: 'submit' }); item.input({ type: 'delete' });
  }, 'cat');
  correction('repeated-virtual-skips-rewind-one-marker-per-action', 'c', item => {
    item.input({ type: 'submit' }); item.input({ type: 'submit' });
    item.input({ type: 'delete', start: 1, end: 1 }); item.input({ type: 'delete', start: 1, end: 1 });
  }, 'c');
  correction('unicode-incorrect-word-reopens-at-grapheme-boundary', 'éx ', item => item.input({ type: 'delete' }), 'éx', { initialTarget: 'é 👩‍💻 another' });
  correction('rejected-space-does-not-create-a-reopen-boundary', 'c ', item => item.input({ type: 'delete' }), '', { rejectIncorrect: true });
  for (const name of ['corrected-before-submission-word-locks', 'incorrect-word-reopens-retaining-text']) {
    assert.ok(correctionCases.get(name).metrics.incorrectAttempts > 0, 'Historical wrong attempts remain in input accuracy.');
  }
  const virtualReopen = correctionCases.get('virtual-incorrect-submission-reopens-without-character-loss');
  assert.equal(virtualReopen.metrics.deletionActions, 1);
  assert.equal(virtualReopen.metrics.deletedUnits, 0);
  function forbiddenCorrection(name, typed, event) {
    const item = create({ mode: 'time', durationMs: 30000, correctionPolicy: 'correct-words-locked', ...(event.provenance === 'composition' ? { inputMethod: 'composition' } : {}) });
    for (const unit of graphemes(typed)) item.input({ type: 'insert', text: unit });
    item.advance(6000);
    const candidate = structuredClone(item.controller.finish('manual'));
    candidate.events.push({ sequence: candidate.events.length, offsetMs: candidate.events.at(-1).offsetMs, provenance: 'keyboard', text: '', ...event });
    cases.push({ name, candidate, owner, consent: true, reject: true });
  }
  forbiddenCorrection('reject-new-policy-correct-prefix-delete', 'cat ', { type: 'delete', start: 0, end: 4 });
  forbiddenCorrection('reject-new-policy-multiword-delete', 'cxt dyg ', { type: 'delete', start: 0, end: 8 });
  forbiddenCorrection('reject-new-policy-partial-prefix-delete', 'cxt ', { type: 'delete', start: 0, end: 1 });
  forbiddenCorrection('reject-new-policy-nonempty-active-word-crossing', 'cxt d', { type: 'delete', start: 0, end: 5 });
  forbiddenCorrection('reject-new-policy-prefix-replacement', 'cxt ', { type: 'replace', start: 0, end: 4, text: 'cat ' });
  forbiddenCorrection('reject-new-policy-prefix-composition', 'cxt ', { type: 'composition', start: 0, end: 4, text: 'cat ', provenance: 'composition' });
  forbiddenCorrection('reject-new-policy-no-op-empty-delete', 'cat ', { type: 'delete', start: 4, end: 4 });
  // Reproducible random edits cover rejected attempts, deletes, extra characters,
  // current-word boundaries, legacy selection replacements and fractional timing.
  let randomState = 0x571930ab;
  const largeRaceTarget = Array.from({ length: 800 }, (_, index) => ['calm', 'clear', 'river', 'focus'][index % 4]).join(' ');
  for (const final of [false, true]) {
    const item = create({ mode: 'race', durationMs: 120000, initialTarget: largeRaceTarget });
    for (const text of ['c', 'a', 'l', 'x']) item.input({ type: 'insert', text });
    item.input({ type: 'delete', start: 3, end: 4, text: '' });
    for (const text of ['m', ' ']) item.input({ type: 'insert', text });
    item.advance(final ? 120000 : 118500);
    if (final) { item.controller.tick(); save('sample-cache-large-target-idle-final120s', item); }
    else cases.push({ name: 'sample-cache-large-target-idle-interim119s', candidate: structuredClone(item.controller.checkpoint()), owner, consent: true, interim: true });
  }
  {
    const item = create({ mode: 'time', durationMs: 30000, initialTarget: 'cat' });
    for (const text of ['c', 'a', 't', ' ']) item.input({ type: 'insert', text }, 100);
    item.advance(5000); item.controller.appendTarget(' dog');
    item.advance(3000); item.controller.appendTarget(' fox');
    item.advance(6000);
    save('sample-cache-idle-target-issuance-without-new-event', item);
  }
  {
    const item = create({ mode: 'time', durationMs: 30000, initialTarget: 'ca' });
    item.input({ type: 'insert', text: 'c' }, 100); item.input({ type: 'insert', text: 'a' }, 100);
    item.controller.appendTarget('t dog'); item.input({ type: 'insert', text: 't' }, 0);
    item.controller.appendTarget(' fox'); item.input({ type: 'insert', text: ' ' }, 0);
    item.advance(6500); save('sample-cache-same-offset-issued-target-anchors', item);
  }
  {
    const item = create({ mode: 'time', durationMs: 30000, initialTarget: 'cat dog' });
    item.input({ type: 'insert', text: 'c' }, 100); item.advance(3000); item.controller.pause();
    item.advance(5000); item.controller.resume();
    item.controller.appendTarget(' fox'); item.controller.appendTarget(' owl');
    item.input({ type: 'insert', text: 'a' }, 0); item.advance(7500);
    save('sample-cache-pause-and-same-offset-idle-issuance', item);
  }
  {
    const item = create({ mode: 'quote', initialTarget: 'cat dog fox' });
    for (const text of ['c', 'a', 't']) item.input({ type: 'insert', text }, 100);
    item.advance(6250); const finite = save('sample-cache-final-finite-invalidates-idle-projection', item);
    assert.ok(finite.timeSeries.at(-2).wpm > 0);
    assert.equal(finite.timeSeries.at(-1).wpm, 0);
    assert.equal(finite.timeSeries.at(-1).localWpm, 0);
  }
  {
    const ascii = Array.from({ length: 128 }, (_, code) => code === 13 ? '' : String.fromCharCode(code)).join('');
    const item = create({ mode: 'code', scoringPolicy: 'code', initialTarget: ascii });
    for (const text of graphemes(ascii)) item.input({ type: 'insert', text });
    save('ascii-fast-path-all-controls-except-cr', item);
  }
  {
    const item = create({ mode: 'code', scoringPolicy: 'code', initialTarget: 'a\r\nb\rc\n' });
    for (const text of ['a', '\r', '\n', 'b', '\r', 'c', '\n']) item.input({ type: 'insert', text });
    save('ascii-fast-path-preserves-split-crlf-and-lone-cr', item);
  }
  {
    const item = create({ mode: 'learn', initialTarget: 'é क्ष 👩‍💻' });
    for (const text of ['e', '\u0301', ' ', 'क्ष', ' ', '👩‍💻']) item.input({ type: 'insert', text });
    save('ascii-boundary-dead-key-indic-emoji', item);
  }
  const random = () => { randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5; return (randomState >>> 0) / 4294967296; };
  for (let index = 0; index < 350; index++) {
    const mode = ['time', 'words', 'code', 'learn', 'zen'][index % 5];
    const item = create({ mode, initialTarget: mode === 'code' ? 'let a = 1;\n\treturn a;' : 'cat dog fox one two three four five six', durationMs: mode === 'time' ? 15000 : undefined, correctionPolicy: index % 3 ? 'current-word' : undefined, rejectIncorrect: index % 7 === 0, scoringPolicy: mode === 'code' ? 'code' : 'prose' });
    for (let step = 0; step < 55 && !item.controller.result; step++) {
      const length = graphemes(item.controller.currentText).length;
      const choice = random();
      if (choice < .18 && length > item.controller.editableStart) item.input({ type: 'delete', start: length - 1, end: length, text: '' }, random() * 250);
      else if (choice < .23) item.input({ type: 'reject', text: 'z' }, random() * 250);
      else item.input({ type: 'insert', text: 'cat dog fox\n\t'[Math.floor(random() * 13)] ?? 'a' }, random() * 250);
    }
    item.advance(5100 + random() * 5000); if (mode === 'time') { item.advance(15000); item.controller.tick(); }
    save(`fuzz-${index}`, item);
  }
  for (let index = 0; index < 100; index++) {
    const item = create({ mode: 'time', durationMs: 30000, correctionPolicy: 'correct-words-locked', initialTarget: 'cat dog fox one two three four five six' });
    item.input({ type: 'insert', text: 'c' });
    for (let step = 0; step < 55 && !item.controller.result; step++) {
      const length = graphemes(item.controller.currentText).length;
      const choice = random();
      if (choice < .2) item.input({ type: 'delete' }, random() * 250);
      else if (choice < .3) item.input({ type: 'delete', start: 0, end: length }, random() * 250);
      else if (choice < .35) item.input({ type: 'insert', start: 0, end: 0, text: 'x' }, random() * 250);
      else if (choice < .4) item.input({ type: 'submit' }, random() * 250);
      else if (choice < .43) item.input({ type: 'reject', text: 'z' }, random() * 250);
      else item.input({ type: 'insert', text: 'cat dog fox'[Math.floor(random() * 11)] ?? 'a' }, random() * 250);
    }
    item.advance(6000); save(`correct-word-lock-fuzz-${index}`, item);
  }
  const good = cases.find(item => item.name === 'corrected-errors-and-batch');
  function tamper(name, mutate, source = good) {
    const value = structuredClone(source); value.name = name; mutate(value); value.reject = true; cases.push(value);
  }
  tamper('reject-false-accuracy', c => c.candidate.metrics.inputAccuracy = 100);
  tamper('reject-false-rate', c => c.candidate.metrics.wpm += 1);
  tamper('reject-false-count', c => c.candidate.metrics.correctAttempts++);
  tamper('reject-cross-owner', c => c.owner = 'other');
  tamper('reject-sequence-gap', c => c.candidate.events[1].sequence += 3);
  tamper('reject-negative-range', c => c.candidate.events[0].start = -1);
  tamper('reject-transcript', c => c.candidate.finalText += 'x');
  tamper('reject-comparison', c => c.candidate.comparisonKey += 'x');
  tamper('reject-duration', c => c.candidate.elapsedMs += 1);
  for (const value of [[], {}, 123]) tamper(`reject-policy-type-${JSON.stringify(value)}`, c => c.candidate.configuration.scoringPolicy = value);
  tamper('reject-null-duration', c => c.candidate.configuration.durationMs = null);
  tamper('reject-new-correction-policy-on-code', c => { c.candidate.configuration.correctionPolicy = 'correct-words-locked'; c.candidate.configuration.scoringPolicy = 'code'; });
  tamper('reject-unknown-correction-policy', c => c.candidate.configuration.correctionPolicy = 'unknown');
  tamper('reject-excessive-input-budget', c => { c.candidate.events = Array.from({length:6},(_,sequence)=>({type:'insert',text:'a'.repeat(4096),sequence,offsetMs:sequence,start:0,end:0,provenance:'keyboard'})); });
  tamper('reject-private-without-consent', c => c.consent = false, cases.find(c => c.name === 'free'));
  tamper('reject-committed-word-edit', c => { const events = c.candidate.events; events.push({type:'delete',text:'',start:0,end:1,sequence:events.length,offsetMs:events.at(-1).offsetMs,provenance:'keyboard'}); });
  // Retain every original full-payload case and assertion. Append independently
  // validated compact pairs using the actual production HTTP helper.
  const legacyCaseCount = cases.length, arenaWirePairs = [], arenaWireCases = [];
  for (const name of [
    'latin', 'nfc', 'arabic', 'devanagari', 'gujarati', 'bengali', 'emoji', 'code', 'free',
    'interim-race', 'sample-cache-large-target-idle-final120s', 'sample-cache-large-target-idle-interim119s',
    'coarse-clock-finish-while-paused', 'virtual-incorrect-submission-reopens-without-character-loss',
    'reject-false-count', 'reject-transcript', 'reject-cross-owner', 'reject-private-without-consent',
  ]) {
    const fullIndex = cases.findIndex(item => item.name === name);
    assert.notEqual(fullIndex, -1, 'Missing original full-payload fixture: ' + name);
    const full = cases[fullIndex], candidate = arenaEvidencePayload(full.candidate);
    assert.deepEqual(Object.keys(candidate), Object.keys(full.candidate).filter(key => !['characters', 'timeSeries', 'cursor'].includes(key)));
    for (const key of Object.keys(candidate)) assert.equal(candidate[key], full.candidate[key], name + ': source field ' + key + ' must retain identity');
    const compact = { ...full, name: 'arena-wire-compact-' + name, candidate };
    arenaWirePairs.push({ name, fullIndex, compactIndex: cases.length, wireFullIndex: arenaWireCases.length, wireCompactIndex: arenaWireCases.length + 1 });
    arenaWireCases.push({ ...full, includeCanonicalPayload: !full.reject }, { ...compact, includeCanonicalPayload: !full.reject });
    cases.push(compact);
  }
  const reference = cases.map(item => {
    try { return { ok: true, result: validateCandidate(item.candidate, item.owner, { cloudConsent: item.consent, interim: item.interim }) }; }
    catch (error) { return { ok: false, message: error.message }; }
  });
  const php = process.env.PHP_BINARY || (existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');
  const args = php.replaceAll('\\', '/').toLowerCase().includes('/xampp/php/') ? ['-n', '-d', 'extension_dir=C:/xampp/php/ext', '-d', 'extension=intl', '-d', 'extension=mbstring', '-d', 'extension=pdo_mysql'] : [];
  const legacyCases = cases.slice(0, legacyCaseCount);
  const run = spawnSync(php, [...args, path.join(import.meta.dirname, 'replay-driver.php')], { input: JSON.stringify(legacyCases), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (process.env.SPAROWTYPE_PHP_CHILD_FAILURE_RECEIPT) {
    const receiptPath = path.resolve(process.env.SPAROWTYPE_PHP_CHILD_FAILURE_RECEIPT);
    await writeFile(receiptPath, JSON.stringify({ date: new Date().toISOString(), scope: 'Original legacy full-corpus child observation; no memory-limit override', cases: legacyCases.length, inputBytes: Buffer.byteLength(JSON.stringify(legacyCases)), inputHash: createHash('sha256').update(JSON.stringify(legacyCases)).digest('hex'), exitCode: run.status, signal: run.signal, error: run.error?.message ?? null, stdout: run.stdout, stderr: run.stderr, privateConfigurationRead: false, databaseConnected: false }, null, 2) + '\n', { flag: 'wx' });
  }
  assert.equal(run.status, 0, run.stderr || run.stdout || run.error?.message);
  const legacyActual = JSON.parse(run.stdout);
  // Preserve the original542-row allocation and assertions. Exact byte proof
  // belongs in a separate small child rather than retaining extra large trees
  // and base64 strings while encoding the entire legacy corpus.
  const wireRun = spawnSync(php, [...args, path.join(import.meta.dirname, 'replay-driver.php')], { input: JSON.stringify(arenaWireCases), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(wireRun.status, 0, wireRun.stderr || wireRun.stdout || wireRun.error?.message);
  const wireActual = JSON.parse(wireRun.stdout);
  // Compare the optional internal projection in separate compact-output children.
  // The original542-row validation allocation and36-row wire child stay intact.
  const chartProjectionChecks = [], chartProjectionMismatches = [];
  const chartProjectionInputs = [];
  for (const [batch, inputCases, fullRows] of [['legacy', legacyCases, legacyActual], ['wire', arenaWireCases, wireActual]]) {
    const input = JSON.stringify(inputCases);
    const child = spawnSync(php, [...args, path.join(import.meta.dirname, 'replay-chart-projection-driver.php')], { input, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    assert.equal(child.status, 0, child.stderr || child.stdout || child.error?.message);
    const rows = JSON.parse(child.stdout);
    assert.equal(rows.length, inputCases.length, `${batch}: every existing row must be compared`);
    chartProjectionInputs.push({ batch, rows: rows.length, inputHash: createHash('sha256').update(input).digest('hex'), outputHash: createHash('sha256').update(child.stdout).digest('hex'), exitCode: child.status });
    for (const [index, row] of rows.entries()) {
      const label = `${batch}:${inputCases[index].name}`;
      try {
        assert.equal(row.ok, fullRows[index].ok, `${label}: default acceptance unchanged`);
        assert.equal(row.submittedCandidateUnchanged, true, `${label}: submitted evidence must not mutate`);
        if (row.ok) {
          const proof = row.chartProjection;
          assert.equal(proof.exception, undefined, `${label}: projection must not throw`);
          for (const key of ['defaultChartPresent', 'explicitTrueChartPresent', 'explicitFalseChartOmitted', 'explicitTrueMatchesDefault', 'explicitFalseMatchesDefaultWithoutChart', 'canonicalCandidateUnchanged', 'canonicalPayloadHashUnchanged']) {
            assert.equal(proof[key], true, `${label}: ${key}`);
          }
          assert.equal(proof.defaultReplayHash, proof.explicitTrueReplayHash, `${label}: full default replay bytes`);
          assert.equal(proof.expectedWithoutChartHash, proof.explicitFalseReplayHash, `${label}: all non-chart replay bytes`);
        } else {
          assert.equal(row.class, fullRows[index].class, `${label}: rejection class unchanged`);
          assert.equal(row.message, fullRows[index].message, `${label}: rejection message unchanged`);
        }
        chartProjectionChecks.push({ name: label, pass: true, outcome: row.ok ? 'exact-full-and-chart-free-projections' : 'unchanged-default-rejection' });
      } catch (error) {
        chartProjectionMismatches.push(error.message);
        chartProjectionChecks.push({ name: label, pass: false, message: error.message });
      }
    }
  }
  // Source34: compare original full persistence bundles and the explicitly
  // non-persistable checkpoint projection in separate compact-output children.
  const checkpointChecks = [], checkpointMismatches = [], checkpointInputs = [], checkpointOverflowChecks = [];
  for (const [batch, inputCases, fullRows] of [['legacy', legacyCases, legacyActual], ['wire', arenaWireCases, wireActual]]) {
    const input = JSON.stringify(inputCases);
    const child = spawnSync(php, [...args, path.join(import.meta.dirname, 'checkpoint-validation-driver.php')], { input, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    assert.equal(child.status, 0, child.stderr || child.stdout || child.error?.message);
    const proof = JSON.parse(child.stdout);
    assert.equal(proof.referenceSourceMatches, true, 'Checkpoint reference must be the exact frozen source33 class');
    assert.equal(proof.rows.length, inputCases.length);
    assert.equal(proof.overflowChecks.length, 8);
    checkpointInputs.push({ batch, rows: proof.rows.length, inputHash: createHash('sha256').update(input).digest('hex'), outputHash: createHash('sha256').update(child.stdout).digest('hex') });
    for (const [index, row] of proof.rows.entries()) {
      const label = batch + ':' + inputCases[index].name;
      try {
        assert.equal(row.ok, fullRows[index].ok, label + ': original acceptance');
        assert.equal(row.defaultFullBundleUnchanged, true, label + ': entire source33 default bundle/hash');
        assert.equal(row.checkpointProjectionEqual, true, label + ': canonical candidate/chart or exact rejection');
        checkpointChecks.push({ name: label, pass: true, outcome: row.ok ? 'exact-original-full-bundle-and-canonical-checkpoint' : 'exact-original-full-and-checkpoint-rejection' });
      } catch (error) { checkpointMismatches.push(error.message); checkpointChecks.push({ name: label, pass: false, message: error.message }); }
    }
    for (const row of proof.overflowChecks) {
      const pass = row.equal && row.expectedOutcome && row.actualRequestBodyDecoder;
      checkpointOverflowChecks.push({ batch, ...row, pass });
      if (!pass) checkpointMismatches.push(batch + ': overflow parity ' + row.name);
    }
  }
  const actual = [...legacyActual, ...arenaWirePairs.map(pair => wireActual[pair.wireCompactIndex])];
  const serializationRun = spawnSync(php, [...args, path.join(import.meta.dirname, 'serialization-contract.php')], { encoding: 'utf8', maxBuffer: 1024 * 1024 });
  assert.equal(serializationRun.status, 0, serializationRun.stderr || serializationRun.stdout);
  const serializationEdges = JSON.parse(serializationRun.stdout);
  const mismatches = [...chartProjectionMismatches, ...checkpointMismatches];
  function compare(expected, received, label) {
    if (typeof expected === 'number' && typeof received === 'number') { assert.ok(Math.abs(expected - received) <= Math.max(1e-9, Math.abs(expected) * 1e-12), `${label}: ${expected} != ${received}`); return; }
    if (expected && typeof expected === 'object') {
      assert.equal(Array.isArray(received), Array.isArray(expected), label);
      assert.deepEqual(Object.keys(received).sort(), Object.keys(expected).sort(), `${label} keys`);
      for (const key of Object.keys(expected)) compare(expected[key], received[key], `${label}.${key}`);
    } else assert.equal(received, expected, label);
  }
  for (let index = 0; index < cases.length; index++) {
    const item = cases[index]; const expected = reference[index]; const received = actual[index];
    try {
      assert.equal(received.serialization.submittedBytesIdentical, true, `${item.name}: submitted bytes must match the retained old serializer`);
      assert.equal(received.ok, expected.ok, `${item.name}: PHP ${received.message}; TS ${expected.message}`);
      if (item.reject) {
        assert.equal(received.ok, false, `${item.name} must reject`);
        assert.equal(received.class, 'InvalidArgumentException', `${item.name} must become HTTP422, not a server error`);
      }
      if (!expected.ok) continue;
      assert.equal(received.serialization.canonicalBytesIdentical, true, `${item.name}: canonical bytes must match the retained old serializer`);
      assert.equal(received.serialization.payloadHashUnchanged, true, `${item.name}: persisted payload hash must remain identical`);
      for (const key of ['metrics', 'timeSeries', 'characters', 'cursor', 'finalText']) compare(expected.result.replay[key], received.result.replay[key], `${item.name}.${key}`);
      for (const key of ['comparisonKey', 'keySummaries', 'lateTargetExtension', 'personalBestEligible']) compare(expected.result[key], received.result[key], `${item.name}.${key}`);
      compare(learningEvidenceFromResult(item.candidate), received.result.learningEvidence, `${item.name}.learningEvidence`);
    } catch (error) { mismatches.push(error.message); }
  }
  const arenaWireChecks = [];
  for (const pair of arenaWirePairs) {
    const full = wireActual[pair.wireFullIndex], compact = wireActual[pair.wireCompactIndex];
    try {
      assert.equal(full.ok, actual[pair.fullIndex].ok, pair.name + ': repeated full row must match the original legacy batch');
      assert.equal(full.serialization.submittedBytesIdentical, true, pair.name + ': repeated full submitted bytes must match the old serializer');
      assert.equal(compact.ok, full.ok, pair.name + ': compact acceptance must match the original full payload');
      if (full.ok) {
        assert.equal(full.serialization.canonicalBytesIdentical, true, pair.name + ': repeated full canonical bytes must match the old serializer');
        assert.equal(full.serialization.payloadHashUnchanged, true, pair.name + ': repeated full canonical hash must match the old serializer');
        compare(actual[pair.fullIndex].result, full.result, pair.name + '.legacy-versus-repeated-full-result');
        assert.equal(typeof full.canonicalPayloadBase64, 'string', pair.name + ': exact PHP canonical bytes required');
        assert.equal(compact.canonicalPayloadBase64, full.canonicalPayloadBase64, pair.name + ': exact canonical bytes must be identical');
        assert.equal(compact.result.payloadHash, full.result.payloadHash, pair.name + ': persisted canonical hash must be identical');
        const canonicalHash = 'sha256:' + createHash('sha256').update(Buffer.from(full.canonicalPayloadBase64, 'base64')).digest('hex');
        assert.equal(full.result.payloadHash, canonicalHash, pair.name + ': compared bytes must be the bytes actually hashed');
        compare(full.result, compact.result, pair.name + '.full-versus-compact-canonical-result');
      } else {
        assert.equal(compact.class, full.class, pair.name + ': rejected compact evidence must retain its error class');
        assert.equal(compact.message, full.message, pair.name + ': rejected compact evidence must retain its error');
      }
      arenaWireChecks.push({ name: pair.name, pass: true, outcome: full.ok ? 'identical-canonical-bytes-hash-and-projections' : 'identical-rejection' });
    } catch (error) {
      mismatches.push(error.message);
      arenaWireChecks.push({ name: pair.name, pass: false, message: error.message });
    }
  }
  for (const message of mismatches) console.error(message);
  const sourceHashes = {};
  for (const file of ['src/lib/typing-core/types.ts','src/lib/typing-core/transcript.ts','src/lib/typing-core/metrics.ts','src/lib/typing-core/session.ts','src/lib/learning-evidence.ts','supabase/functions/_shared/validation.ts','backend/src/SessionValidator.php','backend/tests/replay-driver.php','backend/tests/replay-chart-projection-driver.php','backend/tests/checkpoint-validation-driver.php','backend/tests/CheckpointReferenceValidatorSource33.php','backend/tests/LegacyStablePayload.php','backend/tests/serialization-contract.php']) sourceHashes[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
  sourceHashes['src/domain/arena.ts'] = createHash('sha256').update(arenaSource).digest('hex');
  const report = { date: new Date().toISOString(), scope: 'Pure canonical portable/native PHP differential replay; class-only loaders, no private configuration/HTTP/database mutation', cases: cases.length, uniqueCases: cases.length, phpDriverRows: legacyCases.length + arenaWireCases.length, legacyFullPayloadCases: legacyCaseCount, arenaWireCompatibility: { pairs: arenaWirePairs.length, driverRows: arenaWireCases.length, repeatedFullRows: arenaWirePairs.length, additionalCompactRows: arenaWirePairs.length, checks: arenaWireChecks, mismatches: arenaWireChecks.filter(check => !check.pass).length }, validReferenceCases: reference.filter(c => c.ok).length, rejectionCases: cases.filter(c => c.reject).length, mismatches: mismatches.length, phpBinary: php, unicode: 'ASCII controls/CRLF/Latin/NFC/Arabic/Devanagari/Gujarati/Bengali/emoji', seed: '0x571930ab', serializationCompatibility: { submittedCandidates: actual.length, canonicalCandidatesAndHashes: actual.filter(row => row.ok).length, mismatches: actual.filter(row => !row.serialization.submittedBytesIdentical || row.ok && (!row.serialization.canonicalBytesIdentical || !row.serialization.payloadHashUnchanged)).length, nestedEdges: serializationEdges }, checkpointCompatibility: { driverRows: checkpointChecks.length, batches: checkpointInputs, mismatches: checkpointMismatches.length, checks: checkpointChecks, overflowChecks: checkpointOverflowChecks, memoryLimitRaised: false, originalChildrenUnchanged: true }, chartProjectionCompatibility: { driverRows: chartProjectionChecks.length, batches: chartProjectionInputs, mismatches: chartProjectionMismatches.length, checks: chartProjectionChecks, memoryLimitRaised: false, originalChildrenUnchanged: true }, sourceHashes };
  if (process.env.SPAROWTYPE_PHP_PARITY_REPORT) {
    const reportPath = path.resolve(process.env.SPAROWTYPE_PHP_PARITY_REPORT);
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report));
  assert.equal(mismatches.length, 0, 'PHP canonical replay must match the portable engine.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
