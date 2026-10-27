// Text-only preparation. Does not import or execute either native runner.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-10-21';
const sourceFile = `${directory}/pack-native-browser.mjs`;
const target = `${directory}/pack-native-account-diagnostic.mjs`;
const original = await readFile(sourceFile, 'utf8');
let next = original;
const replaceOnce = (before, after) => {
  assert.equal(next.split(before).length - 1, 1, `Expected one bounded transformation: ${before.slice(0, 80)}`);
  next = next.replace(before, after);
};
replaceOnce("assert.equal(process.env.SPAROWTYPE_PACK_BROWSER_ACCEPTANCE,'1','Wait for the separately coordinated native browser stage.');", "assert.equal(process.env.SPAROWTYPE_PACK_BROWSER_ACCEPTANCE,'1','Wait for the separately coordinated native browser stage.');\nassert.equal(process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC,'webkit-account','This audit-only clone requires explicit webkit-account mode.');");
replaceOnce("prefix=path.join(here,`pack-native-${attempt}`)", "prefix=path.join(here,`pack-native-account-diagnostic-${attempt}`)");
replaceOnce("const diagnostic=process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC==='webkit-humanrace';", "const diagnostic=true;");
replaceOnce("if(process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC)assert.equal(process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC,'webkit-humanrace');", "// Explicit account diagnostic mode was checked before reading the owned env.");
replaceOnce("diagnostic:diagnostic?'webkit-humanrace':null", "diagnostic:'webkit-account'");
replaceOnce("engines:diagnostic?['webkit']:['chromium','edge','firefox','webkit']", "engines:['webkit']");
replaceOnce("expectedCases:diagnostic?1:16", "expectedCases:1");
replaceOnce("const selected=diagnostic?['real two-browser PHP human race shares opponent pace and settles server results']:['real PHP account signup, replay upload, independent-device history/preferences and account deletion','real two-browser PHP human race shares opponent pace and settles server results','real account sign in with dedicated deployment credentials','PHP two-account race authorization and server-owned countdown'];", "const selected=['real PHP account signup, replay upload, independent-device history/preferences and account deletion'];");
replaceOnce("'e2e/php-account-flow.spec.ts','e2e/php-human-race.spec.ts','e2e/auth-flow.spec.ts','e2e/race-mode.spec.ts'", "'e2e/php-account-flow.spec.ts'");
const beforeFile = `${directory}/.final15-php-account-flow-before.ts`;
const accountFile = 'e2e/php-account-flow.spec.ts';
const normalize = text => text.replaceAll('\r\n', '\n');
const before = normalize(await readFile(beforeFile, 'utf8'));
const after = normalize(await readFile(accountFile, 'utf8'));
const restored = after
  .replace(/  const timingAudit = [\s\S]*?(?=  const api = phpApiBase)/, '')
  .replace(/^[ \t]*stage\("[a-z.-]+"\);\n/gm, '');
assert.equal(restored, before, 'Removing only the opt-in synchronous stage helper and calls must restore the complete original test byte-for-byte.');
const awaitCount = text => (text.match(/\bawait\s+/g) ?? []).length;
assert.equal(awaitCount(after), awaitCount(before));
assert.ok(after.includes('test.setTimeout(90000);'));
const sha = value => createHash('sha256').update(value).digest('hex');
await writeFile(target, next, { flag: 'wx' });
await writeFile(`${directory}/final15-native-account-diagnostic-prepared.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'NOT-RUN', target,
  originalRunner: sourceFile, originalRunnerSha256: sha(original), diagnosticRunnerSha256: sha(next),
  original16RunnerUnchanged: true, productionSourceUnchangedByPreparation: true,
  accountFile, beforeFile, beforeNormalizedSha256: sha(before), instrumentedNormalizedSha256: sha(after),
  removingOnlyInstrumentationRestoresEntireOriginalTest: true, awaitCountUnchanged: true,
  originalAwaitCount: awaitCount(before), instrumentedAwaitCount: awaitCount(after),
  deadlineMs: 90000, assertionsAndActionsUnchanged: true, stagesBound: 160,
  diagnosticMode: 'webkit-account', expectedCases: 1, engines: ['webkit'], workers: 1, retries: 0, traces: false,
  stageOutput: 'Only predefined operation aliases and monotonic elapsed times; no account identifiers, input text, credentials, cookies, URLs, request bodies or headers.',
  activation: 'Existing fresh guarded Apache/MariaDB/preview owner and public ready receipt; PACK_BROWSER_ACCEPTANCE=1, PACK_BROWSER_DIAGNOSTIC=webkit-account, PACK_EXPECT_BUILD exact frozen source15 build. Clone forwards SPAROWTYPE_NATIVE_TIMING_AUDIT=1. No browser/services started by this preparer.',
  profileSourceReview: 'Confirmation label matches test exactly. Delete button requires confirmation DELETE and !busy. No static missing-label mismatch; native scrolling/actionability and historical pending action remain UNPROVEN.',
  originalFailure: 'final15-native-browser.json remains FAILED15/16; WebKit account90304ms whole-test timeout with no action witness. A new diagnostic result must not replace or relabel that failure.',
  preparationHarnessCorrection: 'First text-only preparer failed before writing the clone: naive word-count included await in a stage string label (72 vs71). Corrected to await followed by whitespace; exact removal/restoration assertion already passed. No test, browser, service or product code was executed by that preparer.',
}, null, 2) + '\n', { flag: 'wx' });
console.log('Prepared one explicitly opt-in WebKit account diagnostic; no services, browser, build or test execution.');
