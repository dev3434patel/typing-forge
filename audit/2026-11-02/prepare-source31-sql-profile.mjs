// Preparation and syntax/reversal checks only. No backend/runtime is executed.
import assert from 'node:assert/strict';
import path from 'node:path';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';
import { verifySource31BackendOnly } from './source31-sql-profile-guard.mjs';
import { source31SqlProfileWrapperSource } from './source31-sql-profile-web-wrapper.mjs';

const directory = 'audit/2026-11-02';
const cloneRoot = path.resolve(directory, '.final31-sql-profile');
const output = `${directory}/source31-sql-profile-preparation.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
assert.equal(path.dirname(cloneRoot), path.resolve(directory));
const ignored = spawnSync('git', ['check-ignore', '--quiet', `${directory}/.final31-sql-profile/marker`], { windowsHide: true });
assert.equal(ignored.status, 0, 'The clone must be Git-ignored before preparation.');
const source = await verifySource31BackendOnly();
const sha = value => createHash('sha256').update(value).digest('hex');
const runtime = phpRuntime(), backend = [], adapters = [], syntax = [];
async function exactFile(file, bytes) {
  await mkdir(path.dirname(file), { recursive: true });
  try { await writeFile(file, bytes, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; assert.equal(sha(await readFile(file)), sha(bytes), `Existing prepared file must match: ${file}`); }
}
function transform(original, changes, file) {
  let text = original;
  const replacements = [];
  const replace = (before, after, count = 1) => {
    assert.equal(text.split(before).length - 1, count, `Exact instrumentation boundary ${file}: ${before}`);
    text = text.replaceAll(before, after); replacements.push({ before, after, count });
  };
  changes(replace);
  let reversed = text;
  for (const change of [...replacements].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original, `Instrumentation reversal: ${file}`);
  return { text, replacements };
}
for (const file of Object.keys(source.frozen.sourceHashes).filter(file => file.startsWith('backend/')).sort()) {
  const original = await readFile(file);
  assert.equal(normalizedSourceHash(file, original), source.frozen.sourceHashes[file]);
  let result = { text: original.toString('utf8'), replacements: [] };
  if (file === 'backend/src/Database.php') result = transform(result.text, replace => {
    replace('$pdo = new PDO(', '$pdo = new \\SparowTypeAudit\\ProfiledPDO(');
  }, file);
  if (file === 'backend/public/index.php') result = transform(result.text, replace => {
    replace("$config = require dirname(__DIR__).'/bootstrap.php';", "$config = \\SparowTypeAudit\\SqlProfile::stage('bootstrap', static fn() => require dirname(__DIR__).'/bootstrap.php');");
    replace('Security::beginSession($config);', "\\SparowTypeAudit\\SqlProfile::stage('session', static fn() => Security::beginSession($config));");
    replace('$db = Database::connect($config);', "$db = \\SparowTypeAudit\\SqlProfile::stage('connect', static fn() => Database::connect($config));");
    replace('$arenaUser = Security::apiRate($db, $config, $auth, $arenaAction !== null);', "$arenaUser = \\SparowTypeAudit\\SqlProfile::stage('auth_rate', static fn() => Security::apiRate($db, $config, $auth, $arenaAction !== null));");
    replace('$raw = stream_get_contents($stream, (int) $config[\'max_body_bytes\'] + 1);', "$raw = \\SparowTypeAudit\\SqlProfile::stage('body_read', static fn() => stream_get_contents($stream, (int) $config['max_body_bytes'] + 1));");
    replace('$body = RequestBody::decode($raw);', "$body = \\SparowTypeAudit\\SqlProfile::stage('json_decode', static fn() => RequestBody::decode($raw));");
    replace('$result = (new ArenaService($db, $validator, $data))->handle($arenaAction, $body, $user);', "$result = \\SparowTypeAudit\\SqlProfile::stage('arena', static fn() => (new ArenaService($db, $validator, $data))->handle($arenaAction, $body, $user));");
    replace('session_write_close();', "\\SparowTypeAudit\\SqlProfile::stage('session_close', static fn() => session_write_close());", 2);
    replace('echo Database::json($result);', "echo \\SparowTypeAudit\\SqlProfile::stage('json_encode', static fn() => Database::json($result));");
  }, file);
  if (file === 'backend/src/ArenaEvidence.php') result = transform(result.text, replace => {
    replace("$this->validator->validate($candidate,$user['id'],false,!$finish)", "\\SparowTypeAudit\\SqlProfile::stage('candidate_validate', fn() => $this->validator->validate($candidate,$user['id'],false,!$finish))");
    replace("$this->validator->replay($candidate['configuration'],$candidate['events'],$elapsed,['targetText'=>$room['expected_text'],'finiteFinal'=>$finish])", "\\SparowTypeAudit\\SqlProfile::stage('locked_replay', fn() => $this->validator->replay($candidate['configuration'],$candidate['events'],$elapsed,['targetText'=>$room['expected_text'],'finiteFinal'=>$finish]))");
  }, file);
  const bytes = Buffer.from(result.text);
  await exactFile(path.join(cloneRoot, file), bytes);
  backend.push({ file, originalSha256: sha(original), source31NormalizedSha256: source.frozen.sourceHashes[file], profileSha256: sha(bytes), instrumented: result.replacements.length > 0, replacements: result.replacements });
}
assert.equal(backend.length, 38);
const helperFile = `${directory}/sql-profile-runtime-source31.php`, helper = await readFile(helperFile);
await exactFile(path.join(cloneRoot, 'sql-profile-runtime.php'), helper);
const extraFiles = [{ file: 'sql-profile-runtime.php', profileSha256: sha(helper) }];
const originalOwnerFile = `${directory}/pack-capacity-instance-source31-wire.mjs`;
const ownerFile = `${directory}/pack-capacity-instance-source31-sql-profile.mjs`;
const originalDriverFile = `${directory}/run-source31-capacity-wire-burst.mjs`;
const driverFile = `${directory}/run-source31-capacity-wire-sql-profile.mjs`;
const ownerResult = transform(await readFile(originalOwnerFile, 'utf8'), replace => {
  replace('capacity31-wire', 'sql-profile31-wire', 7);
  replace("import readline from 'node:readline';", "import readline from 'node:readline';\nimport { verifySource31SqlProfileClone } from './source31-sql-profile-guard.mjs';\nimport { writeSource31SqlProfileWrapper } from './source31-sql-profile-web-wrapper.mjs';");
  replace("assert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1'", "assert.equal(process.env.SPAROWTYPE_SOURCE31_SQL_PROFILE, '1', 'Explicit coordinated SQL profiling required.');\nconst sqlProfileIdentity = await verifySource31SqlProfileClone();\nassert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1'");
  replace('apache = await prepareApache({ owned, root, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });', 'apache = await prepareApache({ owned, root: sqlProfileIdentity.profileRoot, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });\n    await writeSource31SqlProfileWrapper({ webRoot: apache.webRoot, owned, configFile, profileRoot: sqlProfileIdentity.profileRoot, root, ownerId: id });\n    await receipt(\'sql-profile-clone\', sqlProfileIdentity);');
  replace('    for await (const line of lines) {', "    for await (const line of lines) {\n      assert.ok(['sql-profile31-wire', 'renew', 'cleanup'].includes(line.trim()), 'Diagnostic owner accepts only the declared profile command, renew or cleanup.');");
  replace("assert.equal(capacityDeclared, true, 'The preserved full capacity31 attempt must complete first on this owner.');", "const sqlProfileBefore = await verifySource31SqlProfileClone(); // Separate diagnostic-only wire window; no full/ordinary run is replaced.");
  replace("const capacityWireScript='audit/2026-11-02/run-source31-capacity-wire-burst.mjs';", "const capacityWireScript='audit/2026-11-02/run-source31-capacity-wire-sql-profile.mjs';");
  replace("        const unchanged=(await Promise.all(wireOwnerInputs.map", "        await receipt('sql-profile-clone-after', await verifySource31SqlProfileClone());\n        const unchanged=(await Promise.all(wireOwnerInputs.map");
}, ownerFile);
await exactFile(ownerFile, ownerResult.text);
adapters.push({ originalFile: originalOwnerFile, originalSha256: sha(await readFile(originalOwnerFile)), file: ownerFile, sha256: sha(ownerResult.text), replacements: ownerResult.replacements, exactReversal: true });
const driverResult = transform(await readFile(originalDriverFile, 'utf8'), replace => {
  replace("import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';", "import { verifySource31BackendOnly as verifyFrozenSource, verifySource31SqlProfileClone } from './source31-sql-profile-guard.mjs';");
  replace("assert.equal(process.env.SPAROWTYPE_SOURCE31_CAPACITY_WIRE_ACCEPTANCE, '1'", "assert.equal(process.env.SPAROWTYPE_SOURCE31_SQL_PROFILE, '1', 'Explicit diagnostic window required.');\nawait verifySource31SqlProfileClone();\nassert.equal(process.env.SPAROWTYPE_SOURCE31_CAPACITY_WIRE_ACCEPTANCE, '1'");
  replace('assert.ok(sourceBefore.receipt.compared >= 500);', 'assert.ok(sourceBefore.receipt.compared >= 38); // Backend-only diagnostic, never whole-product identity.');
  replace('assert.equal(sourceBefore.receipt.compared, 505);', 'assert.equal(sourceBefore.receipt.compared, 38);');
  replace('const prefix = `source31-capacity-wire-${ownerId}`;', 'const prefix = `source31-capacity-wire-sql-profile-${ownerId}`;');
  replace('audit/2026-11-02/pack-capacity-instance-source31-wire.mjs', 'audit/2026-11-02/pack-capacity-instance-source31-sql-profile.mjs');
  replace("'audit/2026-11-02/run-source31-capacity-wire-burst.mjs',", "'audit/2026-11-02/run-source31-capacity-wire-sql-profile.mjs', 'audit/2026-11-02/source31-sql-profile-guard.mjs', 'audit/2026-11-02/source31-sql-profile-web-wrapper.mjs', 'audit/2026-11-02/sql-profile-runtime-source31.php', 'audit/2026-11-02/source31-sql-profile-preparation.json',");
  replace("  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build:", "  diagnosticOnly: true, ordinaryCapacityReplaced: false, frontendIdentityClaim: false, instrumentation: 'Guarded exact-source31 backend clone with native PDO/statement timing, bounded Server-Timing and inclusive PHP stage clocks; no parameter/row/SQL text export. Instrumentation and buffering alter diagnostic overhead.',\n  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build:");
  replace("status: passed ? 'PASS-SCOPED-CAPACITY-BURST' : 'FAILED'", "status: passed ? 'PASS-SCOPED-INSTRUMENTED-WIRE-DIAGNOSTIC' : 'FAILED'");
}, driverFile);
await exactFile(driverFile, driverResult.text);
adapters.push({ originalFile: originalDriverFile, originalSha256: sha(await readFile(originalDriverFile)), file: driverFile, sha256: sha(driverResult.text), replacements: driverResult.replacements, exactReversal: true });
const example = source31SqlProfileWrapperSource(path.resolve('backend/storage/pack-instance-0000000000000000/app-config.php'), cloneRoot);
const wrapperExampleFile = path.join(cloneRoot, 'wrapper-syntax-only.php');
await exactFile(wrapperExampleFile, example);
extraFiles.push({ file: 'wrapper-syntax-only.php', profileSha256: sha(example) });
const phpSyntaxFiles = [helperFile, wrapperExampleFile, ...backend.filter(row => row.instrumented).map(row => path.join(cloneRoot, row.file))];
for (const file of phpSyntaxFiles) {
  const result = spawnSync(runtime.binary, [...runtime.args, '-l', file], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, `${file}: ${result.stderr}`); syntax.push({ file, exitCode: result.status });
}
const runtimeFiles = [ownerFile, driverFile, helperFile, `${directory}/source31-sql-profile-guard.mjs`, `${directory}/source31-sql-profile-web-wrapper.mjs`];
for (const file of runtimeFiles.filter(file => file.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', file], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, file); syntax.push({ file, exitCode: result.status });
}
const report = { status: 'PREPARED-NOT-RUN', preparedAt: new Date().toISOString(), source: source.receipt, clone: path.relative(process.cwd(), cloneRoot).replaceAll('\\', '/'), backend, extraFiles, adapters, syntax,
  runtimeFiles: await Promise.all(runtimeFiles.map(async file => ({ file, sha256: sha(await readFile(file)) }))),
  entry: ownerFile, explicitGoFlag: 'SPAROWTYPE_SOURCE31_SQL_PROFILE=1', command: 'sql-profile31-wire', expectedRequests: 1653, concurrency: 20, rooms: 50, accountsPerRoom: 8, strictP95ThresholdMs: 150,
  preserved: ['Original source31 backend38 primary files and authorities', 'Candidate validation and independent authoritative replay at their original call sites/lock boundaries', 'All native PDO method arguments/return values/exceptions/transaction order and fresh row reads', 'Authentication/owner/CSRF/rate limits/DBdurability/64Apachethreads/keepalive and request pacing', 'Original ordinary capacity failures'],
  instrumentation: ['Three cloned files only: Database selects native PDO subclass; publicindex adds inclusive stage clocks; ArenaEvidence times both original replay paths.', 'Statement ATTR_STATEMENT_CLASS enables native prepare/execute/fetch clocks without SQL/parameter/row export.', 'Exact owned config guard precedes clonedbootstrap; one JSON output buffer permits bounded <=6000byte Server-Timing header.', 'Source31 backend38 and fixturecore/wire are independently guarded; later frontend UI is excluded explicitly.'],
  limits: ['Diagnostic timing includes instrumentation/class/buffering overhead and cannot replace ordinary acceptance.', 'PHP total excludes Apache/Zend startup, wrapper compile, request shutdown and network/flush; HTTP-minus-PHP residual remains unattributed.', 'Stages/SQL intervals overlap; inclusive totals must not be added as exclusive critical-path time.', 'Native execute elapsed may include DBlock/network/scheduling time and cannot alone identify a specific database wait.', 'Class-load/native runtime/header controls are UNVERIFIED until a separately approved isolated runtime window.'],
  backendConfigRead: false, originalServicesTouched: false, productionSourceEdited: false, servicesStarted: 0, runtimeJobsExecuted: 0 };
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, clonedBackendFiles: backend.length, instrumentedCloneFiles: backend.filter(row => row.instrumented).length, syntax: syntax.length, entry: ownerFile, command: report.command }));
