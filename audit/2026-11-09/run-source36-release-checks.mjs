// Two explicitly scheduled release checks; no capacity or browser benchmark.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { access, open, readFile, readdir, writeFile } from 'node:fs/promises';
import { verifyFrozenSource } from '../2026-11-05-followup/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_SOURCE36_RELEASE_CHECKS, '1');
assert.equal(process.env.SPAROWTYPE_FINAL36_BUILD_ID, 'd89f84d74519bf2bbae0');
const prefix = 'audit/2026-11-09/source36-release-checks';
const protocolFile = `${prefix}-protocol.json`, output = `${prefix}.json`;
const commands = [
  { id: 'production-audit', command: 'npm audit --omit=dev --json', stdout: `${prefix}-production-audit.json`, stderr: `${prefix}-production-audit.stderr.log` },
  { id: 'bundle', command: 'npm run check:bundle', stdout: `${prefix}-bundle.log`, stderr: `${prefix}-bundle.stderr.log` },
];
for (const file of [output, protocolFile, ...commands.flatMap(row => [row.stdout, row.stderr])]) await assert.rejects(access(file), { code: 'ENOENT' });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFile = 'audit/2026-11-05-followup/final36-source.json';
const identity = async () => {
  const source = await verifyFrozenSource(sourceFile);
  assert.equal(source.receipt.compared, 506); assert.deepEqual(source.receipt.mismatches, []);
  const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
  assert.equal(build.version, 'd89f84d74519bf2bbae0'); assert.deepEqual(build, source.frozen.local);
  const files = [...(await readdir('e2e')).filter(file => file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
  assert.equal(files.length, 73);
  const hashes = Object.fromEntries(await Promise.all(files.map(async file => [file, sha(await readFile(file))])));
  const dependencySha256 = sha(JSON.stringify(hashes));
  assert.equal(dependencySha256, '525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37');
  return { source: source.receipt, build, dependencies: files.length, dependencySha256 };
};
const before = await identity();
const inputs = [import.meta.filename, sourceFile, 'package.json', 'package-lock.json', 'scripts/check-bundle.mjs'];
const inputHashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, sha(await readFile(file))])));
const protocol = { declaredAt: new Date().toISOString(), commands, before, inputHashes, deadlineMs: 180000, automaticRetries: 0, sequential: true, resultsFiltered: false, noPerformanceScoreClaim: true, defaultArtifactRebuilt: false };
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const results = [];
let failure = null;
try {
  for (const definition of commands) {
    const stdout = await open(definition.stdout, 'wx'), stderr = await open(definition.stderr, 'wx');
    const marker = randomBytes(12).toString('hex');
    const command = `$env:SPAROWTYPE_RELEASE_CHECK_OWNER='${marker}'; ${definition.command}`;
    const startedAt = new Date().toISOString(), started = performance.now();
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, stdio: ['ignore', stdout.fd, stderr.fd] });
    let timedOut = false, stopProof = null, stopping = null;
    const timer = setTimeout(() => {
      timedOut = true;
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
      const guard = `$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${child.pid}'; if($p -and $p.ParentProcessId -eq ${process.pid} -and $p.Name -eq 'powershell.exe' -and $p.CommandLine.Contains('${marker}')){ & taskkill.exe /PID ${child.pid} /T /F | Out-Null; exit $LASTEXITCODE }else{exit 3}`;
      stopping = new Promise(resolve => {
        const stopper = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', guard], { windowsHide: true, stdio: 'ignore' });
        stopper.once('error', () => { stopProof = false; resolve(); });
        stopper.once('close', code => { stopProof = code === 0; resolve(); });
      });
    }, protocol.deadlineMs);
    let exitCode = null;
    try {
      exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
      if (stopping) await stopping;
    } finally { clearTimeout(timer); await stdout.close(); await stderr.close(); }
    const row = { ...definition, startedAt, finishedAt: new Date().toISOString(), durationMs: performance.now() - started, exitCode, timedOut, ownedForcedStopProof: stopProof, status: exitCode === 0 && !timedOut ? 'PASS-SCOPED' : 'FAILED', stdoutSha256: sha(await readFile(definition.stdout)), stderrSha256: sha(await readFile(definition.stderr)) };
    if (definition.id === 'production-audit') {
      const audit = JSON.parse(await readFile(definition.stdout, 'utf8'));
      row.vulnerabilities = audit.metadata?.vulnerabilities ?? null;
      if (!row.vulnerabilities || row.vulnerabilities.total !== 0) row.status = 'FAILED';
    }
    results.push(row); console.log(JSON.stringify({ id: row.id, status: row.status, exitCode, vulnerabilities: row.vulnerabilities ?? undefined }));
    assert.equal(row.status, 'PASS-SCOPED', `Stop after the actual ${definition.id} failure; no automatic retry.`);
  }
} catch (error) { failure = { name: error.name, message: String(error.message).slice(0, 300) }; }
let after = null, inputsUnchanged = false;
try {
  after = await identity(); assert.deepEqual(after, before);
  inputsUnchanged = (await Promise.all(inputs.map(async file => sha(await readFile(file)) === inputHashes[file]))).every(Boolean);
  assert.equal(inputsUnchanged, true);
} catch (error) { failure ??= { name: error.name, message: String(error.message).slice(0, 300) }; }
const result = { status: !failure && results.length === commands.length && results.every(row => row.status === 'PASS-SCOPED') ? 'PASS-SCOPED' : 'FAILED', finishedAt: new Date().toISOString(), protocolFile, protocolSha256: sha(await readFile(protocolFile)), before, after, inputsUnchanged, results, failure, noCapacityOrMobileOrLighthouseMeasurement: true };
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: result.status }));
process.exitCode = result.status === 'PASS-SCOPED' ? 0 : 1;
