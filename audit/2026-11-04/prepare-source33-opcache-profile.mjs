import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { fragmentPath, fragmentSha256, extensionSha256, ownedOpcacheEndpointSource } from './source33-opcache-runtime.mjs';
const directory = 'audit/2026-11-02', support = 'audit/2026-11-04/source33-opcache-runtime.mjs';
const manifestFile = 'audit/2026-11-04/source33-opcache-profile-preparation.json';
const hash = value => createHash('sha256').update(value).digest('hex');
assert.equal(hash(await readFile(fragmentPath)), fragmentSha256);
const sourceFile = `${directory}/final33-source.json`, source = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(Object.keys(source.sourceHashes).length, 505);
const prepared = [];
const mappings = [
  ['pack-capacity-instance-source33.mjs', 'pack-opcache-instance-source33.mjs'],
  ['pack-capacity-instance-source33-wire.mjs', 'pack-opcache-instance-source33-wire.mjs'],
  ['run-source33-capacity-burst.mjs', 'run-source33-opcache-capacity-burst.mjs'],
  ['run-source33-capacity-wire-burst.mjs', 'run-source33-opcache-capacity-wire-burst.mjs'],
];
for (const [oldName, newName] of mappings) {
  const originalFile = `${directory}/${oldName}`, targetFile = `${directory}/${newName}`;
  const original = await readFile(originalFile, 'utf8'), eol = original.includes('\r\n') ? '\r\n' : '\n';
  let text = original;
  const transforms = [];
  const replace = (from, to, expected = 1) => {
    const count = text.split(from).length - 1;
    assert.equal(count, expected, `${oldName}: expected anchor ${from.slice(0,80)}`);
    text = text.replaceAll(from, to); transforms.push({ from, to, count });
  };
  for (const [from, to] of [['pack-capacity-instance-source33', 'pack-opcache-instance-source33'], ['source33-capacity', 'source33-opcache-capacity'], ['capacity33', 'capacity33-opcache']]) {
    const count = text.split(from).length - 1;
    if (count) replace(from, to, count);
  }
  if (oldName.startsWith('run-')) {
    const importAnchor = "import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';";
    replace(importAnchor, `${importAnchor}${eol}import { verifyOpcodeProfileReceipt } from '../2026-11-04/source33-opcache-runtime.mjs';`);
    const ownerAnchor = 'assert.match(ownerId ?? \'\', /^[a-f0-9]{16}$/);';
    replace(ownerAnchor, `${ownerAnchor}${eol}const opcacheProfileBefore = await verifyOpcodeProfileReceipt({ ownerId, receiptPath: process.env.SPAROWTYPE_OPCACHE_STATUS_FILE, allowColdStart: !import.meta.filename.includes('-wire-') });`);
    replace("'scripts/php-runtime.mjs'];", `'scripts/php-runtime.mjs', '${support}', '${fragmentPath}', '${manifestFile}'];`);
    replace('ownerId, origin: origin.href, rooms:', 'ownerId, runtimeProfile: opcacheProfileBefore, ordinaryUncachedResultsReplaced: false, origin: origin.href, rooms:');
  } else {
    const importAnchor = "import { phpRuntime } from '../../scripts/php-runtime.mjs';";
    replace(importAnchor, `${importAnchor}${eol}import { configureOwnedOpcache, installOwnedOpcacheEndpoint, readOwnedOpcacheSnapshot } from '../2026-11-04/source33-opcache-runtime.mjs';`);
    replace('let apache = null;', 'let apache = null; let opcacheConfiguration = null; let nativeArenaProfileDeclared = false;');
    const configure = [
      "  assert.equal(httpRuntime, 'apache', 'The separately declared opcode-cache profile requires the owned web SAPI.');",
      "  opcacheConfiguration = await configureOwnedOpcache({ root, owned, id, phpDirectory: path.dirname(runtime.binary), phpIni });",
      "  await receipt('opcache-configuration', opcacheConfiguration.publicProfile);",
      '',
    ].join(eol);
    replace('  environment = { ...process.env, PHP_BINARY:', configure + '  environment = { ...process.env, PHP_BINARY:');
    const apacheAnchor = '    apache = await prepareApache({ owned, root, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });';
    replace(apacheAnchor, `${apacheAnchor}${eol}    await receipt('opcache-endpoint', await installOwnedOpcacheEndpoint({ apache, owned, configuration: opcacheConfiguration, guard: secrets.arena }));`);
    const startup = [
      "  await receipt('opcache-startup', await readOwnedOpcacheSnapshot({ port: apiPort, configuration: opcacheConfiguration, guard: secrets.arena, stage: 'startup-ready', requirePositiveHits: false }));",
      '',
    ].join(eol);
    replace('  const identities = { httpRuntime,', startup + '  const identities = { httpRuntime,');
    replace("'arena-http':'audit/mega-pack-2026-10-21/run-arena-http.mjs'", "'arena-http':'audit/2026-11-02/run-source33-arena-chart-http.mjs'");
    for (const [variable, command] of [['capacityScript', 'capacity33-opcache'], ...(oldName.includes('-wire') ? [['capacityWireScript', 'capacity33-opcache-wire']] : [])]) {
      const captureLine = `        const result=await capture(process.execPath,['--experimental-transform-types',path.join(root,${variable})],'${command}',undefined,240000);`;
      const before = [
        `        const opcodeBeforeName = 'opcache-before-${command}';`,
        `        await receipt(opcodeBeforeName, await readOwnedOpcacheSnapshot({ port: apiPort, configuration: opcacheConfiguration, guard: secrets.arena, stage: 'before-${command}', requirePositiveHits: ${command.endsWith('-wire') ? 'true' : 'false'} }));`,
        '        environment.SPAROWTYPE_OPCACHE_STATUS_FILE = path.join(receipts, `pack-backend-${id}-${opcodeBeforeName}.json`);',
      ].join(eol);
      const after = `        await receipt('opcache-after-${command}', await readOwnedOpcacheSnapshot({ port: apiPort, configuration: opcacheConfiguration, guard: secrets.arena, stage: 'after-${command}', requirePositiveHits: true }));`;
      replace(captureLine, `${before}${eol}${captureLine}${eol}${after}`);
    }
    if (oldName.includes('-wire')) {
      const nativeCommand = [
        "      if (line.trim() === 'arena-http33-opcache') {",
        "        assert.equal(capacityWireDeclared, true, 'Run both declared profile capacity workloads before the lifecycle suite.');",
        "        if (nativeArenaProfileDeclared) { publicMessage({ stage: 'opcache-native-already-declared' }); continue; }",
        "        nativeArenaProfileDeclared = true;",
        "        await receipt('opcache-before-arena-http', await readOwnedOpcacheSnapshot({ port: apiPort, configuration: opcacheConfiguration, guard: secrets.arena, stage: 'before-arena-http33-opcache', requirePositiveHits: true }));",
        "        const result = await capture(process.execPath, ['--experimental-transform-types', path.join(root, 'audit/2026-11-02/run-source33-arena-chart-http.mjs')], 'arena-http33-opcache', undefined, 120000);",
        "        const lifecycle = JSON.parse(await readFile(environment.ARENA_HTTP_REPORT, 'utf8'));",
        "        await receipt('arena-http-opcache-summary', { status: lifecycle.status, passed: lifecycle.passed, failed: lifecycle.failed, report: path.relative(root, environment.ARENA_HTTP_REPORT).replaceAll('\\\\','/') });",
        "        await receipt('opcache-after-arena-http', await readOwnedOpcacheSnapshot({ port: apiPort, configuration: opcacheConfiguration, guard: secrets.arena, stage: 'after-arena-http33-opcache', requirePositiveHits: true }));",
        "        const status = { name: 'arena-http33-opcache', exitCode: result.code, status: result.code === 0 && lifecycle.passed === 32 ? 'PASS' : 'FAIL' };",
        "        suiteResults.push(status); failed ||= status.status !== 'PASS'; publicMessage({ stage: 'opcache-native-complete', ...status });",
        '      }', '',
      ].join(eol);
      replace("      if (line.trim() === 'capacity33-opcache-wire') {", nativeCommand + "      if (line.trim() === 'capacity33-opcache-wire') {");
    }
  }
  let reversed = text;
  for (const item of [...transforms].reverse()) {
    assert.equal(reversed.split(item.to).length - 1, item.count, 'Declared transformation must reverse exactly.');
    reversed = reversed.replaceAll(item.to, item.from);
  }
  assert.equal(reversed, original);
  await writeFile(targetFile, text, { flag: 'wx' });
  const syntax = spawnSync(process.execPath, ['--check', targetFile], { encoding: 'utf8', windowsHide: true });
  assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
  prepared.push({ originalFile, targetFile, originalSha256: hash(original), targetSha256: hash(text), transforms, exactReverse: true, syntaxExit: syntax.status });
}
const runtime = phpRuntime(), root = process.cwd();
const endpoint = ownedOpcacheEndpointSource({ configuration: { root, cacheId: 'sparow_audit_0000000000000000', rawHashes: {} }, guard: '0'.repeat(64) });
const endpointSyntax = 'audit/2026-11-04/.final33-opcache-endpoint-syntax.php';
await writeFile(endpointSyntax, endpoint, { flag: 'wx' });
const endpointCheck = spawnSync(runtime.binary, [...runtime.args, '-l', endpointSyntax], { encoding: 'utf8', windowsHide: true });
assert.equal(endpointCheck.status, 0, endpointCheck.stderr || endpointCheck.stdout);
const supportCheck = spawnSync(process.execPath, ['--check', support], { encoding: 'utf8', windowsHide: true });
assert.equal(supportCheck.status, 0, supportCheck.stderr || supportCheck.stdout);
const additionalInputs = [fragmentPath, 'docs/PHP_OPCACHE_PROFILE.md', support, 'audit/2026-11-02/run-source33-arena-chart-http.mjs', ...prepared.map(item => item.targetFile)];
const report = {
  recordedAt: new Date().toISOString(), status: 'PREPARED-UNVERIFIED-RUNTIME', sourceFile, sourceManifestSha256: hash(await readFile(sourceFile)), sourceFiles: 505,
  clientBuild: source.local.version, runtimeVariant: 'source33-opcache-production-config-variant',
  fragmentOutsideFrozen505: true, additionalInputHashes: Object.fromEntries(await Promise.all(additionalInputs.map(async file => [file, hash(await readFile(file))]))),
  fragmentSha256, extensionSha256, prepared, syntaxChecks: prepared.length + 2,
  entry: 'audit/2026-11-02/pack-opcache-instance-source33-wire.mjs',
  flags: { SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE: '1', SPAROWTYPE_PACK_HTTP_RUNTIME: 'apache', SPAROWTYPE_PACK_APACHE_ACCEPTANCE: '1', SPAROWTYPE_PACK_SUITES: 'password', SPAROWTYPE_PACK_HOLD: '1', SPAROWTYPE_PACK_KEEP_FAILURE: '1', SPAROWTYPE_SOURCE33_CAPACITY_ACCEPTANCE: '1', SPAROWTYPE_SOURCE33_CAPACITY_WIRE_ACCEPTANCE: '1', SPAROWTYPE_SOURCE33_OPCACHE_PROFILE: '1', SPAROWTYPE_FINAL33_BUILD_ID: source.local.version },
  commandsInOrder: ['capacity33-opcache', 'capacity33-opcache-wire', 'arena-http33-opcache', 'cleanup'],
  exactOperationsPerRun: 1653, concurrency: 20, rooms: 50, accountsPerRoom: 8, p95StrictlyBelowMs: 150,
  coldStart: { existingReadinessRequestsUnchanged: true, addedApplicationWarmupRequests: 0, startupHitsMayBeZero: true, postWorkloadHitsMustBePositive: true, sourceScriptCacheBooleansRequiredAfterWorkload: true },
  noCacheReset: true, noRetries: true, noFiltering: true, opcodeCacheActuallyEnabled: 'UNVERIFIED-NOT-RUN', ordinaryUncachedFailuresRetained: true,
  jitOrPersistentPdoOrDatabaseOrRatePolicyChanged: false, primarySourceOrFrozenTestsChanged: false, servicesStarted: 0,
};
await writeFile(manifestFile, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, entry: report.entry, syntaxChecks: report.syntaxChecks, build: report.clientBuild, sourceFiles: report.sourceFiles }));
