// Explicitly coordinated CI parity only. PGlite runs in memory; Deno typechecks
// the unchanged legacy reference functions without starting their HTTP handlers.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { access, open, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { filesWithin, hash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_FINAL25_CI_EXTRA, '1', 'Wait for the separate coordinated database/Deno CI window.');
const directory = 'audit/2026-10-27', prefix = 'final25-ci-extra';
const output = `${directory}/${prefix}.json`, protocolFile = `${directory}/${prefix}-protocol.json`;
for (const file of [output, protocolFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const build = process.env.SPAROWTYPE_FINAL25_BUILD_ID;
assert.match(build ?? '', /^[a-f0-9]{20}$/);
const sourceFile = `${directory}/final25-source.json`, before = await verifyFrozenSource(sourceFile);
assert.equal(before.frozen.local.version, build);
assert.equal(before.receipt.compared, 504);
assert.deepEqual(before.receipt.mismatches, []);
assert.equal(JSON.parse(await readFile('dist/offline-build.json', 'utf8')).version, build);
const functions = ['supabase/functions/submit-session/index.ts', 'supabase/functions/race-operation/index.ts', 'supabase/functions/delete-account/index.ts'];
const inputFiles = [import.meta.filename, sourceFile, '.github/workflows/ci.yml', 'package.json', 'package-lock.json', 'node_modules/@electric-sql/pglite/package.json'];
for (const root of ['supabase/tests', 'supabase/migrations', 'supabase/functions']) {
  for (const file of await filesWithin(root)) if (/\.(?:[cm]?[jt]s|sql)$/.test(file)) inputFiles.push(`${root}/${file}`);
}
inputFiles.sort();
const inputHashes = Object.fromEntries(await Promise.all(inputFiles.map(async file => [file, hash(await readFile(file))])));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(pkg.scripts['test:database'], 'node supabase/tests/compatibility-check.mjs node_modules/@electric-sql/pglite');
const workflow = await readFile('.github/workflows/ci.yml', 'utf8');
const denoCommand = `deno check --node-modules-dir=none --no-lock ${functions.join(' ')}`;
assert.ok(workflow.includes('npm run test:database') && workflow.includes(denoCommand));
const quote = value => `'${value.replaceAll("'", "''")}'`;
let deno = null;
if (process.env.SPAROWTYPE_DENO_BINARY) {
  assert.ok(path.isAbsolute(process.env.SPAROWTYPE_DENO_BINARY), 'An explicit Deno binary must be an absolute path.');
  await access(process.env.SPAROWTYPE_DENO_BINARY); deno = process.env.SPAROWTYPE_DENO_BINARY;
} else {
  const found = spawnSync('where.exe', ['deno.exe'], { windowsHide: true, encoding: 'utf8', timeout: 5000, maxBuffer: 100000 });
  if (found.status === 0) deno = found.stdout.trim().split(/\r?\n/)[0];
}
const protocol = { declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-RUN', build, sourceBefore: before.receipt, commands: ['npm run test:database', denoCommand], automaticRetries: 0, resultFiltering: false, commandDeadlineMs: 180000, outputLimitBytesPerStream: 2000000, inputHashes,
  denoAvailability: deno ? 'AVAILABLE-PENDING-TYPECHECK' : 'UNAVAILABLE-DO-NOT-CLAIM-PASS', denoAutoInstallOrDownload: false,
  scope: 'Actual npm PostgreSQL/WASM compatibility and SQL integrity assertions in isolated in-memory PGlite, followed by exact CI Deno typechecking if its executable exists. No external database/API, private configuration or deployed function is contacted. Deno may resolve declared public npm imports through its normal dependency cache/network.',
  frontendBuildReexecuted: false, servicesStarted: false, browsersStarted: false, privateConfigurationRead: false };
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const results = [];
const run = async (id, publicCommand, command) => {
  const logFile = `${directory}/${prefix}-${id}.log`, log = await open(logFile, 'wx');
  const marker = randomBytes(12).toString('hex'), startedAt = new Date().toISOString(), started = performance.now();
  let stdout = '', stderr = '', termination = null, timedOut = false, overflow = false, spawnError = null, timer;
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `$env:SPAROWTYPE_CI_EXTRA_OWNER=${quote(marker)}; ${command}`], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stopping = null;
  const stopOwnedTree = () => {
    if (stopping || child.exitCode !== null || child.signalCode !== null || !child.pid) return stopping;
    // Match this still-live direct child, exact parent PID and unpredictable
    // command-line marker before stopping only its process tree on a deadline.
    const script = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${child.pid}'; if($p -and $p.ParentProcessId -eq ${process.pid} -and $p.Name -eq 'powershell.exe' -and $p.CommandLine.Contains(${quote(marker)})){ & taskkill.exe /PID ${child.pid} /T /F | Out-Null; if($LASTEXITCODE -eq 0){'OWNED-TREE-STOPPED'}else{exit 2} }else{exit 3}`;
    stopping = new Promise(resolve => {
      const guard = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
      const deadline = setTimeout(() => { guard.kill(); resolve(false); }, 10000);
      let text = ''; guard.stdout.on('data', bytes => { text += bytes; });
      guard.once('error', () => { clearTimeout(deadline); resolve(false); });
      guard.once('close', code => { clearTimeout(deadline); resolve(code === 0 && text.trim() === 'OWNED-TREE-STOPPED'); });
    }).then(value => { termination = value ? 'OWNED-TREE-STOPPED' : 'UNVERIFIED'; if (!value && child.exitCode === null && child.signalCode === null) child.kill(); return value; });
    return stopping;
  };
  child.stdout.on('data', bytes => { if (Buffer.byteLength(stdout) + bytes.length <= 2000000) stdout += bytes; else { overflow = true; void stopOwnedTree(); } });
  child.stderr.on('data', bytes => { if (Buffer.byteLength(stderr) + bytes.length <= 2000000) stderr += bytes; else { overflow = true; void stopOwnedTree(); } });
  timer = setTimeout(() => { timedOut = true; void stopOwnedTree(); }, 180000);
  let exitCode;
  try {
    exitCode = await new Promise(resolve => { child.once('error', error => { spawnError = error.name; resolve(null); }); child.once('close', resolve); });
    if (stopping) await stopping;
  } finally {
    clearTimeout(timer);
    await log.writeFile(stdout + stderr); await log.close();
  }
  const row = { id, command: publicCommand, commandOwnerPid: child.pid, startedAt, finishedAt: new Date().toISOString(), durationMs: performance.now() - started, exitCode, status: exitCode === 0 && !timedOut && !overflow && !spawnError ? 'PASS-SCOPED' : 'FAILED', timedOut, outputOverflow: overflow, overflowLogIncompleteAndFailed: overflow, spawnError, deadlineCleanup: termination, logFile, stdoutBytes: Buffer.byteLength(stdout), stderrBytes: Buffer.byteLength(stderr) };
  results.push(row); console.log(JSON.stringify(row));
  assert.notEqual(termination, 'UNVERIFIED', 'Stop: the timed-out owned command tree could not be confirmed stopped.');
};
let failure = null;
try {
  await run('database', 'npm run test:database', 'npm run test:database');
  if (deno) await run('deno', denoCommand, `& ${quote(deno)} check --node-modules-dir=none --no-lock ${functions.map(quote).join(' ')}`);
  else results.push({ id: 'deno', command: denoCommand, status: 'UNVERIFIED', reason: 'No Deno executable was found. No automatic installation, substitute checker or passing claim.', exitCode: null });
} catch (error) { failure = { name: error.name, message: String(error.message).slice(0, 400) }; }
finally {
  const after = (await verifyFrozenSource(sourceFile)).receipt;
  const harnessInputsUnchanged = (await Promise.all(inputFiles.map(async file => hash(await readFile(file)) === inputHashes[file]))).every(Boolean);
  const passed = !failure && results.length === 2 && results.every(row => row.status === 'PASS-SCOPED') && after.compared === 504 && after.mismatches.length === 0 && harnessInputsUnchanged;
  const report = { status: passed ? 'PASS-SCOPED' : results.some(row => row.status === 'UNVERIFIED') && !failure && results.every(row => ['PASS-SCOPED', 'UNVERIFIED'].includes(row.status)) ? 'PARTIAL-UNVERIFIED' : 'FAILED', finishedAt: new Date().toISOString(), protocol, results, failure, sourceAfter: after, harnessInputsUnchanged, servicesStarted: false, browsersStarted: false, externalDatabaseConnected: false, privateConfigurationRead: false, frontendBuildReexecuted: false };
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, output, commands: results.map(row => ({ id: row.id, status: row.status })) }));
  process.exitCode = passed ? 0 : 1;
}
