// Preparation only. No browsers, services, build or measurement execute here.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/2026-11-02';
const originalDriver = `${directory}/measure-mobile-workspaces-static-final28.mjs`;
const originalWrapper = `${directory}/run-mobile-workspaces-static-final28-candidate.mjs`;
const driverFile = `${directory}/measure-mobile-native-pipeline-final28.mjs`;
const wrapperFile = `${directory}/run-final28-mobile-native-pipeline.mjs`;
const planFile = `${directory}/final28-mobile-native-pipeline-preparation-v2.json`;
for (const file of [driverFile, wrapperFile, planFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const original = await readFile(originalDriver, 'utf8');
let driver = original;
const driverTransforms = [];
function changeDriver(from, to, count = 1) {
  assert.equal(driver.split(from).length - 1, count, from.slice(0, 100));
  driverTransforms.push({ from, to, count }); driver = driver.replaceAll(from, to);
}
changeDriver("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\nimport { installNativePipelineProbe, beginNativePipelineDiagnostic, markNativePipelineInputStart, endNativePipelineDiagnostic, abortNativePipelineDiagnostic } from './mobile-native-pipeline-runtime.mjs';");
changeDriver("process.argv[2] ?? 'mobile-workspaces-final28-static'", "process.argv[2] ?? 'final28-mobile-native-pipeline'");
changeDriver('`${directory}/mobile-workspaces-final28-static-protocol.json`', '`${directory}/final28-mobile-native-pipeline-protocol.json`');
changeDriver('`${directory}/mobile-workspaces-final28-static-build.json`', '`${directory}/final28-mobile-native-pipeline-build.json`');
changeDriver('async function beginObservation(page, context, input) {', 'async function beginObservation(page, context, input, caseId) {');
changeDriver('  });\n}\n\nasync function endObservation(page) {', '  });\n  await beginNativePipelineDiagnostic(page, cdp, caseId, prefix, protocol);\n}\n\nasync function endObservation(page) {');
changeDriver('await beginObservation(page, context, input);', 'await beginObservation(page, context, input, specification.id);', 4);
changeDriver('    await input.pressSequentially(text, { delay: 0 });', '    await markNativePipelineInputStart(page);\n    await input.pressSequentially(text, { delay: 0 });\n    receipt.pipeline = await endNativePipelineDiagnostic(page);', 3);
changeDriver('    const page = await context.newPage();', '    await installNativePipelineProbe(context, specification.id, protocol);\n    const page = await context.newPage();');
changeDriver('      await context.close();\n      receipt.finishedAt', '      const unfinished = await abortNativePipelineDiagnostic(page);\n      if (unfinished) { receipt.diagnosticIncomplete = unfinished; receipt.passed = false; }\n      await context.close();\n      receipt.finishedAt');
let reversed = driver;
for (const item of [...driverTransforms].reverse()) {
  assert.equal(reversed.split(item.to).length - 1, item.count); reversed = reversed.replaceAll(item.to, item.from);
}
assert.equal(reversed, original);

const wrapperOriginal = await readFile(originalWrapper, 'utf8');
let wrapper = wrapperOriginal;
const wrapperTransforms = [];
function changeWrapper(from, to, count = 1) {
  assert.equal(wrapper.split(from).length - 1, count, from.slice(0, 100));
  wrapperTransforms.push({ from, to, count }); wrapper = wrapper.replaceAll(from, to);
}
changeWrapper("import { spawn } from 'node:child_process';", "import { spawn, spawnSync } from 'node:child_process';");
changeWrapper("assert.equal(process.env.SPAROWTYPE_MOBILE_STATIC_ACCEPTANCE, '1', 'Only execute in the coordinated quiet measurement window.');", "assert.equal(process.env.SPAROWTYPE_MOBILE_NATIVE_PIPELINE, '1', 'Wait for the separately coordinated source28 DIAGNOSTIC window.');");
changeWrapper("process.argv[2] || 'mobile-workspaces-final28-static-candidate'", "process.argv[2] || 'final28-mobile-native-pipeline'");
changeWrapper("assert.equal(prefix, 'mobile-workspaces-final28-static-candidate', 'This entry is the one explicitly declared candidate measurement only.');", "assert.match(prefix, /^final28-mobile-native-pipeline(?:-[a-z0-9]+)*$/);");
changeWrapper("const originalDriver = 'audit/2026-10-21/measure-mobile-workspaces.mjs';", `const originalDriver = '${originalDriver}';`);
changeWrapper('`${audit}/measure-mobile-workspaces-static-final28.mjs`', '`${audit}/measure-mobile-native-pipeline-final28.mjs`');
const start = wrapper.indexOf('const referenceChanges = [');
const end = wrapper.indexOf('const protocolBytes = await readFile(originalProtocol);');
assert.ok(start > 0 && end > start);
changeWrapper(wrapper.slice(start, end), `const planFile = '${planFile}';
const plan = JSON.parse(await readFile(planFile, 'utf8'));
const referenceChanges = plan.driverTransforms;
const original = await readFile(originalDriver, 'utf8');
let reversed = await readFile(driver, 'utf8');
for (const item of [...referenceChanges].reverse()) { assert.equal(reversed.split(item.to).length-1,item.count); reversed = reversed.replaceAll(item.to,item.from); }
assert.equal(reversed,original,'Only declared diagnostic insertions may differ; original input actions and functional assertions remain.');
const originalHash = hash(original);
assert.equal(originalHash,plan.originalDriverSha256);
const helperFiles = ['${directory}/mobile-native-pipeline-runtime.mjs','${directory}/mobile-native-pipeline-analysis.mjs',planFile,sourceFile];
const helperHashes = Object.fromEntries(await Promise.all(helperFiles.map(async file=>[file,hash(await readFile(file))])));
for(const [file,expected] of Object.entries(plan.helperHashes))assert.equal(helperHashes[file],expected);
for(const id of ['learn','local-bot'])for(const suffix of ['-trace.json','-timeline.json']){
 const file=\`\${audit}/.\${prefix}-\${id}\${suffix}\`;
 assert.equal(spawnSync('git',['check-ignore',file],{encoding:'utf8',windowsHide:true}).status,0,'Raw trace artifacts must stay Git-ignored.');
}
`);
changeWrapper('assertionsAndTimingByteIdentical: true', 'assertionsAndOriginalInputSequencePreserved: true, diagnosticTimingOverhead: true, timingAcceptanceReused: false');
changeWrapper("artifactDirectory: directory, originalNormalProtocol: originalProtocol,", "artifactDirectory: directory, originalNormalProtocol: originalProtocol, diagnostic: true,\n    cases: protocol.cases.filter(item => ['learn','local-bot'].includes(item.id)),\n    setterProbeEnabled: process.env.SPAROWTYPE_MOBILE_NATIVE_SETTER_PROBE === '1',\n    instrumentation: 'Typing-window streamed CDP devtools.timeline + blink.user_timing;32MB trace buffer/64MB raw-file cap; no screenshots or V8 sampling. Optional transparent native textarea setters installed before React; exact prototype descriptor restoration.',");
changeWrapper("comparability: 'Separate explicitly declared frontend-only measurement. The earlier backend-enabled run and all failures remain preserved; this does not replace it or establish field INP.',", "comparability: 'DIAGNOSTIC only: Learn and local BOT selected before execution, identical native actions and4xCPU. Source28 candidate104/64/120/24ms and source27 failures remain unchanged. Tracing and getters perturb execution; no SLO or field INP claim.',");
changeWrapper("measured.cases.length === 4 && measured.cases.every(item => item.passed) ? 'PASS-SCOPED' : 'FAILED'", "measured.cases.length === 2 && measured.cases.every(item => item.passed && item.pipeline?.status === 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE') ? 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE' : 'FAILED'");
changeWrapper("if (report.status !== 'PASS-SCOPED') process.exitCode = 1;", "if (report.status !== 'COMPLETE-DIAGNOSTIC-NOT-ACCEPTANCE') process.exitCode = 1;");
changeWrapper("report.originalProtocolUnchanged = hash(await readFile(originalProtocol)) === originalProtocolHash;", "report.originalProtocolUnchanged = hash(await readFile(originalProtocol)) === originalProtocolHash;\n    report.helperInputsUnchanged = (await Promise.all(helperFiles.map(async file=>hash(await readFile(file))===helperHashes[file]))).every(Boolean);");
changeWrapper('!report.originalProtocolUnchanged) report.status', '!report.originalProtocolUnchanged || !report.helperInputsUnchanged) report.status');
let wrapperReversed = wrapper;
for (const item of [...wrapperTransforms].reverse()) {
  assert.equal(wrapperReversed.split(item.to).length - 1, item.count); wrapperReversed = wrapperReversed.replaceAll(item.to, item.from);
}
assert.equal(wrapperReversed, wrapperOriginal);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const helperFiles = [`${directory}/mobile-native-pipeline-runtime.mjs`, `${directory}/mobile-native-pipeline-analysis.mjs`];
const helperHashes = Object.fromEntries(await Promise.all(helperFiles.map(async file => [file, hash(await readFile(file))])));
const candidateBuild = JSON.parse(await readFile(`${directory}/mobile-workspaces-final28-static-candidate-build.json`, 'utf8'));
await writeFile(driverFile, driver, { flag: 'wx' });
await writeFile(wrapperFile, wrapper, { flag: 'wx' });
await writeFile(planFile, `${JSON.stringify({ preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  sourceBuild: candidateBuild.sourceExpectedBuild, staticBuild: candidateBuild.local.version, sourceFiles: 505,
  originalDriver, originalDriverSha256: hash(original), driverFile, driverSha256: hash(driver), driverTransforms,
  originalWrapper, originalWrapperSha256: hash(wrapperOriginal), wrapperFile, wrapperSha256: hash(wrapper), wrapperTransforms,
  driverExactReversal: true, wrapperExactReversal: true, helperHashes,
  casesDeclaredBeforeExecution: ['learn', 'local-bot'], originalAcceptanceFilesChanged: false,
  instrumentation: { traceCategories: ['devtools.timeline','blink.user_timing'], rawTraceByteLimit: 67108864,
    traceBufferKiB: 32768, highFrequencyCpuSampling: false, traceScreenshots: false,
    originalCpuThrottle: 4, originalCaseTimeoutMs: 33000, originalTotalWatchdogMs: 145000,
    optionalSetterProbeFlag: 'SPAROWTYPE_MOBILE_NATIVE_SETTER_PROBE=1',
    nativeSetters: ['value','setSelectionRange','selectionStart','selectionEnd','selectionDirection'],
    prototypeDescriptorsRestoredExactlyRequired: true,
    perNodeReactDescriptorMutated: false,
    capturedReactDelegateLimit: 'Before-mount prototype wrappers may be captured by React. After stop they are inactive Reflect.apply pass-through until context close; own React descriptors are never replaced.',
    rawFiles: '.final28-mobile-native-pipeline-<case>-trace.json and -timeline.json (Git-ignored)',
    layoutNodeResolution: 'At most32 numeric Layout/style root/backend-node references, resolved by CDP after trace capture, retaining only tag/id/class/data-testid.',
    inputWindows: 'Start/end marks surround the original pressSequentially call. BOT ends before manual Finish; Learn final insertion may include automatic results. Summary separates fully contained strict pre-final spans from boundary overlaps.',
  }, servicesStarted: 0, browsersStarted: 0, testsRun: 0, productionFilesEdited: false,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', driverFile, wrapperFile, planFile, runtimeStarted: false }));
