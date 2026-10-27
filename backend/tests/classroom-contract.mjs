import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { phpRuntime } from '../../scripts/php-runtime.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const temporaryRoot = path.resolve(tmpdir());
const temporary = await mkdtemp(path.join(temporaryRoot, 'sparowtype-classroom-'));
try {
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('vite'))('esbuild');
const compiled = path.join(temporary, 'session.mjs');
await build({
  entryPoints: [path.join(root, 'src/lib/typing-core/session.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2022',
  outfile: compiled,
  logLevel: 'silent',
});
const { SessionController } = await import(pathToFileURL(compiled).href);
const runtime = phpRuntime(), checks = [];
const call = body => {
  const run = spawnSync(runtime.binary, [...runtime.args, path.join(root, 'backend/tests/classroom-contract.php')], { input: JSON.stringify(body), encoding: 'utf8', windowsHide: true });
  if (run.status !== 0) throw new Error(`Pure classroom PHP harness failed: ${run.stderr || run.stdout.slice(-2000)}`);
  return JSON.parse(run.stdout);
};
const check = (name, value) => { checks.push({ name, pass: Boolean(value) }); if (!value) throw new Error(name); };
const memberId = '22222222-2222-4222-8222-222222222222', classId = '33333333-3333-4333-8333-333333333333';
const config = call({ action: 'configuration', sessionId: '11111111-1111-4111-8111-111111111111', memberId, classId }).value;
let now = 0;
const controller = new SessionController(config, { now: () => now, wallNow: () => 1700000000000 + now });
for (const key of config.initialTarget) { controller.input({ type: 'insert', text: key }); now += 100; }
const candidate = structuredClone(controller.result ?? controller.finish('completed'));
const accepted = call({ action: 'validate', candidate, memberId, classId });
check('native PHP independently replays the issued original classroom practice', accepted.ok && accepted.value.metrics.insertionAttempts === config.initialTarget.length);
check('receipt identifies SHA256 without returning a raw event log', accepted.value.hashAlgorithm === 'sha256:' && !JSON.stringify(accepted.value).includes('events'));
for (const alias of ['Student-01', 'विद्यार्थी', 'વિદ્યાર્થી']) check('valid private alias', call({ action: 'alias', alias }).ok);
for (const alias of ['x', 'student@example.test', '<script>', 'x'.repeat(33)]) check('invalid alias rejected', call({ action: 'alias', alias }).status === 422);
for (const [name, mutate] of [
  ['assignment text', value => { value.configuration.initialTarget += ' forged'; }],
  ['membership scope', value => { value.configuration.ownerScope = 'guest'; }],
  ['extra metadata', value => { value.configuration.settings.extra = true; }],
  ['early completion', value => { value.finishReason = 'manual'; }],
  ['claimed metrics', value => { value.metrics.wpm += 100; }],
]) {
  const changed = structuredClone(candidate); mutate(changed);
  check(`${name} rejected`, !call({ action: 'validate', candidate: changed, memberId, classId }).ok);
}
const receipt = { recordedAt: new Date().toISOString(), status: 'PASS-SCOPED', scope: 'Pure native PHP alias/issued-contract/replay checks; no DB connection, private configuration, HTTP or classroom account used.', nodeVersion: process.version, referenceCompilation: 'esbuild bundled ESM, ES2022 target; no Node TypeScript stripping required', passed: checks.length, failed: 0, checks, databaseLifecycle: 'NOT-RUN', browser: 'NOT-RUN' };
const report = path.resolve(process.env.CLASSROOM_CONTRACT_REPORT || path.join(root, `audit/mega-pack-2026-10-21/classroom-php-contract-${Date.now()}-${process.pid}.json`));
await mkdir(path.dirname(report), { recursive: true });
await writeFile(report, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, passed: checks.length, failed: 0 }));
} finally {
  assert.equal(path.dirname(path.resolve(temporary)), temporaryRoot);
  assert.match(path.basename(temporary), /^sparowtype-classroom-[A-Za-z0-9_-]+$/);
  await rm(temporary, { recursive: true, force: true });
}
