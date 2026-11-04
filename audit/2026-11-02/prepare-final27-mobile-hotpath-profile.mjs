// Code preparation only. This does not launch a browser, server, or measurement.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const old = 'audit/2026-10-27', out = 'audit/2026-11-02';
const originalDriver = `${old}/measure-mobile-workspaces-static-final27.mjs`;
const originalWrapper = `${old}/run-mobile-workspaces-static-final27.mjs`;
const driverFile = `${out}/measure-mobile-workspaces-hotpath-final27.mjs`;
const wrapperFile = `${out}/run-final27-mobile-hotpath-profile.mjs`;
const planFile = `${out}/final27-mobile-hotpath-profile-preparation.json`;
const original = await readFile(originalDriver, 'utf8');
const driverTransforms = [];
let driver = original;
function changeDriver(from, to, count = 1) {
  assert.equal(driver.split(from).length - 1, count); driverTransforms.push({ from, to, count }); driver = driver.replaceAll(from, to);
}
changeDriver("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\nimport { beginHotpathDiagnostic, markHotpathInputStart, endHotpathDiagnostic, abortHotpathDiagnostic } from './mobile-hotpath-profile-runtime.mjs';");
changeDriver("const directory = 'audit/2026-10-27';", "const directory = 'audit/2026-11-02';");
changeDriver("process.argv[2] ?? 'mobile-workspaces-final27-static'", "process.argv[2] ?? 'final27-mobile-hotpath-profile'");
changeDriver('`${directory}/mobile-workspaces-final27-static-protocol.json`', '`${directory}/final27-mobile-hotpath-profile-protocol.json`');
changeDriver('`${directory}/mobile-workspaces-final27-static-build.json`', '`${directory}/final27-mobile-hotpath-profile-build.json`');
changeDriver('async function beginObservation(page, context, input) {', 'async function beginObservation(page, context, input, caseId) {');
changeDriver('  });\n}\n\nasync function endObservation(page) {', '  });\n  await beginHotpathDiagnostic(page, cdp, caseId, prefix, protocol);\n}\n\nasync function endObservation(page) {');
changeDriver('await beginObservation(page, context, input);', 'await beginObservation(page, context, input, specification.id);', 4);
changeDriver('    await input.pressSequentially(text, { delay: 0 });', '    await markHotpathInputStart(page);\n    await input.pressSequentially(text, { delay: 0 });\n    receipt.profile = await endHotpathDiagnostic(page);', 3);
changeDriver('      await context.close();\n      receipt.finishedAt', '      const unfinished = await abortHotpathDiagnostic(page);\n      if (unfinished) { receipt.diagnosticIncomplete = unfinished; receipt.passed = false; }\n      await context.close();\n      receipt.finishedAt');
let reversed = driver;
for (const item of [...driverTransforms].reverse()) {
  assert.equal(reversed.split(item.to).length - 1, item.count); reversed = reversed.replaceAll(item.to, item.from);
}
assert.equal(reversed, original);

const wrapperOriginal = await readFile(originalWrapper, 'utf8');
const wrapperTransforms = [];
let wrapper = wrapperOriginal;
function changeWrapper(from, to, count = 1) {
  assert.equal(wrapper.split(from).length - 1, count); wrapperTransforms.push({ from, to, count }); wrapper = wrapper.replaceAll(from, to);
}
changeWrapper("import { spawn } from 'node:child_process';", "import { spawn, spawnSync } from 'node:child_process';");
changeWrapper("assert.equal(process.env.SPAROWTYPE_MOBILE_STATIC_ACCEPTANCE, '1', 'Only execute in the coordinated quiet measurement window.');", "assert.equal(process.env.SPAROWTYPE_MOBILE_HOTPATH_PROFILE, '1', 'Only execute the separately coordinated DIAGNOSTIC window.');");
changeWrapper("const audit = 'audit/2026-10-27';", "const audit = 'audit/2026-11-02';");
changeWrapper("process.argv[2] || 'mobile-workspaces-final27-static'", "process.argv[2] || 'final27-mobile-hotpath-profile'");
changeWrapper('/^mobile-workspaces-final27-static(?:-[a-z0-9]+)*$/', '/^final27-mobile-hotpath-profile(?:-[a-z0-9]+)*$/');
changeWrapper('const sourceFile = `${audit}/final27-source.json`;', "const sourceFile = 'audit/2026-10-27/final27-source.json';");
changeWrapper("const originalDriver = 'audit/2026-10-21/measure-mobile-workspaces.mjs';", "const originalDriver = 'audit/2026-10-27/measure-mobile-workspaces-static-final27.mjs';");
changeWrapper('`${audit}/measure-mobile-workspaces-static-final27.mjs`', '`${audit}/measure-mobile-workspaces-hotpath-final27.mjs`');
changeWrapper("const originalProtocol = 'audit/2026-10-21/mobile-workspaces-final7-protocol.json';", "const originalProtocol = 'audit/2026-10-27/mobile-workspaces-final27-static-protocol.json';");
const start = wrapper.indexOf('const referenceChanges = [');
const end = wrapper.indexOf('const protocolBytes = await readFile(originalProtocol);');
assert.ok(start > 0 && end > start);
const originalValidation = wrapper.slice(start, end);
const replacementValidation = `const plan = JSON.parse(await readFile('audit/2026-11-02/final27-mobile-hotpath-profile-preparation.json', 'utf8'));
const referenceChanges = plan.driverTransforms;
const original = await readFile(originalDriver, 'utf8');
let reverted = await readFile(driver, 'utf8');
for (const item of [...referenceChanges].reverse()) { assert.equal(reverted.split(item.to).length-1, item.count); reverted = reverted.replaceAll(item.to,item.from); }
assert.equal(reverted, original, 'Only the disclosed diagnostic insertions may differ from the original acceptance driver.');
const originalHash = hash(original);
assert.equal(originalHash, plan.originalDriverSha256);
const helperFiles = ['audit/2026-11-02/mobile-hotpath-profile-runtime.mjs','audit/2026-11-02/mobile-hotpath-profile-analysis.mjs'];
const helperHashes = Object.fromEntries(await Promise.all(helperFiles.map(async file=>[file,hash(await readFile(file))])));
for(const file of helperFiles)assert.equal(helperHashes[file],plan.helperHashes[file]);
for(const id of ['learn','local-bot'])for(const suffix of ['.cpuprofile','-timeline.json']){
 const file=\`\${audit}/.\${prefix}-\${id}\${suffix}\`;
 const ignored=spawnSync('git',['check-ignore',file],{encoding:'utf8',windowsHide:true});
 assert.equal(ignored.status,0,'Raw diagnostic artifacts must remain Git-ignored.');
}
`;
changeWrapper(originalValidation, replacementValidation);
changeWrapper('`${audit}/final27-static-artifacts.json`', "'audit/2026-10-27/final27-static-artifacts.json'");
changeWrapper('assertionsAndTimingByteIdentical: true', "assertionsAndInputSequencePreserved: true, instrumentationChangesTiming: true, timingAcceptanceReused: false");
changeWrapper("originalNormalProtocol: originalProtocol,", "originalNormalProtocol: originalProtocol, diagnostic: true,\n    cases: protocol.cases.filter(item => ['learn','local-bot'].includes(item.id)),\n    instrumentation: 'V8 CPU sampling1000us, bounded LoAF/EventTiming/longtask observers and beforeinput phase markers; no product monkeypatches or synthetic timing.',");
changeWrapper("comparability: 'Separate explicitly declared frontend-only measurement. The earlier backend-enabled run and all failures remain preserved; this does not replace it or establish field INP.',", "comparability: 'DIAGNOSTIC only: exactly Learn and local BOT selected before execution. Original four-workspace112/48/112/40ms acceptance results remain unchanged. Profiling/buffer overhead disqualifies these timing values as acceptance; last-insertion/result overlap is separately labeled.',");
changeWrapper("measured.cases.length === 4 && measured.cases.every(item => item.passed) ? 'PASS-SCOPED' : 'FAILED'", "measured.cases.length === 2 && measured.cases.every(item => item.passed && item.profile?.status === 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE') ? 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE' : 'FAILED'");
changeWrapper("if (report.status !== 'PASS-SCOPED') process.exitCode = 1;", "if (report.status !== 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE') process.exitCode = 1;");
changeWrapper("report.originalProtocolUnchanged = hash(await readFile(originalProtocol)) === originalProtocolHash;", "report.originalProtocolUnchanged = hash(await readFile(originalProtocol)) === originalProtocolHash;\n    report.helperInputsUnchanged = (await Promise.all(helperFiles.map(async file => hash(await readFile(file)) === helperHashes[file]))).every(Boolean);");
changeWrapper('!report.originalProtocolUnchanged) report.status', '!report.originalProtocolUnchanged || !report.helperInputsUnchanged) report.status');
let wrapperReversed = wrapper;
for (const item of [...wrapperTransforms].reverse()) { assert.equal(wrapperReversed.split(item.to).length - 1, item.count); wrapperReversed = wrapperReversed.replaceAll(item.to, item.from); }
assert.equal(wrapperReversed, wrapperOriginal);
const hash = value => createHash('sha256').update(value).digest('hex');
const helperFiles = [`${out}/mobile-hotpath-profile-runtime.mjs`, `${out}/mobile-hotpath-profile-analysis.mjs`];
const helperHashes = Object.fromEntries(await Promise.all(helperFiles.map(async file => [file, hash(await readFile(file))])));
await writeFile(driverFile, driver, { flag: 'wx' }); await writeFile(wrapperFile, wrapper, { flag: 'wx' });
await writeFile(planFile, JSON.stringify({ preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  sourceBuild: '11de46af5d4a80e0e830', staticBuild: 'fac344923bbf9cbde394', expectedSourceFiles: 505,
  originalDriver, originalDriverSha256: hash(original), driverFile, driverSha256: hash(driver), driverTransforms,
  originalWrapper, originalWrapperSha256: hash(wrapperOriginal), wrapperFile, wrapperSha256: hash(wrapper), wrapperTransforms,
  driverExactReversal: true, wrapperExactReversal: true, helperHashes,
  casesDeclaredBeforeExecution: ['learn', 'local-bot'], originalFourWorkspaceAcceptanceReportsUnchanged: true,
  profile: { cpuSamplingIntervalMicroseconds: 1000, fullBrowserTrace: false, productMonkeypatches: false,
    bounds: 'Same33000ms per-case and145000ms total deadlines; same4xCPU and native input sequence. CPU/LoAF observers add overhead; two post-input rAFs flush entry delivery. BOT profile ends before manualFinish; Learn final insertion is labeled as a possible result transition.',
    rawFiles: 'Git-ignored .final27-mobile-hotpath-profile-<case>.cpuprofile and -timeline.json',
    publicOutput: 'Bounded sanitized per-phase CPU/LoAF summaries; no raw typed text, request bodies, headers or credentials.' },
  testsBrowsersServicesStarted: false, productOrAcceptanceDriverEdits: false,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ driverFile, wrapperFile, planFile, driverExactReversal: true, wrapperExactReversal: true, runtimeStarted: false }));
