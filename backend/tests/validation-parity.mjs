import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
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
  // Reproducible random edits cover rejected attempts, deletes, extra characters,
  // current-word boundaries, legacy selection replacements and fractional timing.
  let randomState = 0x571930ab;
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
  tamper('reject-excessive-input-budget', c => { c.candidate.events = Array.from({length:6},(_,sequence)=>({type:'insert',text:'a'.repeat(4096),sequence,offsetMs:sequence,start:0,end:0,provenance:'keyboard'})); });
  tamper('reject-private-without-consent', c => c.consent = false, cases.find(c => c.name === 'free'));
  tamper('reject-committed-word-edit', c => { const events = c.candidate.events; events.push({type:'delete',text:'',start:0,end:1,sequence:events.length,offsetMs:events.at(-1).offsetMs,provenance:'keyboard'}); });
  const reference = cases.map(item => {
    try { return { ok: true, result: validateCandidate(item.candidate, item.owner, { cloudConsent: item.consent, interim: item.interim }) }; }
    catch (error) { return { ok: false, message: error.message }; }
  });
  const php = process.env.PHP_BINARY || (existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');
  const args = php.replaceAll('\\', '/').toLowerCase().includes('/xampp/php/') ? ['-n', '-d', 'extension_dir=C:/xampp/php/ext', '-d', 'extension=intl', '-d', 'extension=mbstring', '-d', 'extension=pdo_mysql'] : [];
  const run = spawnSync(php, [...args, path.join(import.meta.dirname, 'replay-driver.php')], { input: JSON.stringify(cases), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(run.status, 0, run.stderr);
  const actual = JSON.parse(run.stdout);
  const mismatches = [];
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
      assert.equal(received.ok, expected.ok, `${item.name}: PHP ${received.message}; TS ${expected.message}`);
      if (item.reject) {
        assert.equal(received.ok, false, `${item.name} must reject`);
        assert.equal(received.class, 'InvalidArgumentException', `${item.name} must become HTTP422, not a server error`);
      }
      if (!expected.ok) continue;
      for (const key of ['metrics', 'timeSeries', 'characters', 'cursor', 'finalText']) compare(expected.result.replay[key], received.result.replay[key], `${item.name}.${key}`);
      for (const key of ['comparisonKey', 'keySummaries', 'lateTargetExtension', 'personalBestEligible']) compare(expected.result[key], received.result[key], `${item.name}.${key}`);
      compare(learningEvidenceFromResult(item.candidate), received.result.learningEvidence, `${item.name}.learningEvidence`);
    } catch (error) { mismatches.push(error.message); }
  }
  for (const message of mismatches) console.error(message);
  const report = { cases: cases.length, validReferenceCases: reference.filter(c => c.ok).length, rejectionCases: cases.filter(c => c.reject).length, mismatches: mismatches.length, phpBinary: php, unicode: 'Latin/NFC/Arabic/Devanagari/Gujarati/Bengali/emoji', seed: '0x571930ab' };
  console.log(JSON.stringify(report));
  assert.equal(mismatches.length, 0, 'PHP canonical replay must match the portable engine.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
