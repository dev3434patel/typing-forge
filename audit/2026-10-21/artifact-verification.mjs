import { readFile, readdir, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';

export const auditDirectory = 'audit/2026-10-21';
export const arcadeIds = ['word-invaders', 'ghost-gp', 'daily-gauntlet', 'rhythm-typing', 'key-tower', 'snake-words', 'lava-rise', 'boss-duel'];
export const publicOfflineRoutes = ['/', '/typing-test', '/learn', '/lessons', '/typing-practice', '/practice', '/touch-typing', '/keyboard-lab', '/about', '/privacy', '/terms', '/offline', '/race', '/leaderboard', '/games', '/arcade', ...arcadeIds.map(id => `/arcade/${id}`)];
export const staticOfflineRoutes = ['/stats', '/settings', '/profile', '/auth', '/ranked', '/studio', '/progression', '/classroom'];
export const directStaticRoutes = ['typing-test', 'learn', 'lessons', 'typing-practice', 'practice', 'touch-typing', 'keyboard-lab', 'about', 'privacy', 'terms', 'games', 'arcade', ...arcadeIds.map(id => `arcade/${id}`), 'stats', 'settings', 'profile', 'auth', 'race', 'ranked', 'leaderboard', 'offline', 'studio', 'progression', 'classroom', 'friends', 'arena'];
export const migrations = ['002-progression.sql', '003_classroom.sql', '004_social.sql', '005_arena.sql'];
export const hash = value => createHash('sha256').update(value).digest('hex');
export const normalizedSourceHash = (file, bytes) => hash(/\.(?:[cm]?[jt]sx?|json|css|html|xml|txt|svg|ya?ml|webmanifest|php|sql)$/.test(file) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes);
export const json = async file => JSON.parse(await readFile(file, 'utf8'));
export function argumentsFor(allowed) {
  const result = {};
  for (let index = 2; index < process.argv.length; index += 2) {
    const name = process.argv[index], value = process.argv[index + 1];
    assert.ok(allowed.includes(name) && value && !value.startsWith('--'), `Supported options: ${allowed.join(', ')}`);
    assert.equal(result[name], undefined, `Duplicate option ${name}`); result[name] = value;
  }
  return result;
}
export async function reserve(prefix, suffix) {
  assert.match(prefix, /^[a-z][a-z0-9-]+$/);
  const file = `${auditDirectory}/${prefix}-${suffix}.json`;
  const report = { declaredAt: new Date().toISOString(), status: 'PARTIAL', checks: [], automaticRetries: 0, resultFiltering: false };
  await writeFile(file, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  const check = (name, pass, detail) => report.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) });
  const finish = async () => { report.finishedAt = new Date().toISOString(); report.status = !report.error && report.checks.every(item => item.pass) ? 'PASS-SCOPED' : 'FAILED'; await writeFile(file, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ file, status: report.status, passed: report.checks.filter(item => item.pass).length, total: report.checks.length, error: report.error ?? null })); if (report.status !== 'PASS-SCOPED') process.exitCode = 1; };
  return { file, report, check, finish };
}
export async function filesWithin(directory, prefix = '') {
  const result = [];
  if (!prefix) { const root = await lstat(directory); assert.ok(root.isDirectory() && !root.isSymbolicLink(), `An ordinary artifact directory is required: ${directory}`); }
  for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, `Symlink refused: ${directory}/${prefix}/${entry.name}`);
    const file = path.posix.join(prefix.replaceAll('\\', '/'), entry.name);
    if (entry.isDirectory()) result.push(...await filesWithin(directory, file));
    else { assert.ok(entry.isFile(), `Unexpected non-file: ${file}`); result.push(file); }
  }
  return result.sort();
}
export async function verifyFrozenSource(sourceFile) {
  const frozen = await json(sourceFile), mismatches = [];
  assert.ok(frozen.local?.version && frozen.sourceHashes && Object.keys(frozen.sourceHashes).length > 100, 'A completed source/build identity is required.');
  for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
    assert.ok(!path.isAbsolute(file) && !file.split(/[\\/]/).includes('..') && !/(?:^|\/)(?:config\.php|storage|\.env(?:\.|$))|\.local\.php$/.test(file), 'Private or escaping paths are not source verification inputs.');
    if (normalizedSourceHash(file, await readFile(file)) !== expected) mismatches.push(file);
  }
  return { frozen, receipt: { sourceFile, expectedBuild: frozen.local.version, compared: Object.keys(frozen.sourceHashes).length, mismatches } };
}
export function workerRouteContract(worker, frontendOnly) {
  const expression = worker.match(/const PUBLIC_ROUTES = new Set\((\[[\s\S]*?\])\);/)?.[1];
  assert.ok(expression, 'The worker exact public-route set must be readable.');
  // Evaluate only this bounded array literal, never service-worker handlers.
  assert.ok(expression.length < 6000 && !/\b(?:import|function|fetch|process|require)\b/.test(expression));
  const actual = Array.from(runInNewContext(expression, { FRONTEND_ONLY: frontendOnly }, { timeout: 100 })).sort();
  const expected = [...publicOfflineRoutes, ...(frontendOnly ? staticOfflineRoutes : [])].sort();
  return { actual, expected, exact: JSON.stringify(actual) === JSON.stringify(expected), privateOrUnknownExcluded: ['/friends', '/arena', '/arena/ABCD1234', '/race/ABCD1234', '/arcade/unknown', '/settings/private'].every(route => !actual.includes(route)) };
}
export async function sceneAssets(directory, all) {
  const output = [];
  const listed = all ?? await filesWithin(directory);
  for (const file of listed.filter(file => /^assets\/(?:keyboard-scene-|keyboard-bloom-|keyboard-render-worker-|three\.module-).*\.js$/.test(file))) {
    const body = await readFile(path.join(directory, file));
    const kind = file.includes('keyboard-scene-bridge-') ? 'bridge' : file.includes('keyboard-bloom-') ? 'bloom' : file.includes('keyboard-render-worker-') ? 'worker' : file.includes('three.module-') ? 'three' : 'scene';
    const bootstrapPattern = /from"\.\/index-[A-Za-z0-9_-]+\.js"/g;
    output.push({ file, kind, bytes: body.length, gzipBytes: gzipSync(body).length, sha256: hash(body), ...(kind === 'bridge' ? { normalizedBootstrapSpecifierSha256: hash(body.toString('utf8').replace(bootstrapPattern, 'from"./index-BOOTSTRAP.js"')), bootstrapSpecifierCount: [...body.toString('utf8').matchAll(bootstrapPattern)].length } : {}) });
  }
  return output;
}
export async function qualityBaseline(priorFile, priorPublicFile) {
  const prior = await json(priorFile), priorPublic = await json(priorPublicFile);
  assert.ok(prior.artifacts?.length && priorPublic.hashes, 'Preserved old static and public-hash receipts are required.');
  return { prior, priorPublic, priorFile, priorPublicFile };
}
export function compareQuality(assets, baseline) {
  const priorAssets = baseline.prior.artifacts[0].sceneAssets;
  const details = [];
  for (const kind of ['scene', 'bloom', 'three']) {
    const current = assets.filter(asset => asset.kind === kind), old = priorAssets.filter(asset => asset.kind === kind);
    details.push({ kind, pass: current.length === 1 && old.length === 1 && current[0].file === old[0].file && current[0].sha256 === old[0].sha256 && current[0].bytes === old[0].bytes, comparison: 'Exact filename, raw bytes and SHA-256 against preserved checkpoint; no normalization.' });
  }
  const workers = assets.filter(asset => asset.kind === 'worker');
  details.push({ kind: 'worker', pass: workers.length === 1 && baseline.priorPublic.hashes[workers[0].file] === workers[0].sha256, comparison: 'Exact public worker filename and SHA-256 against preserved public-file receipt.' });
  const bridge = assets.filter(asset => asset.kind === 'bridge'), oldBridge = priorAssets.filter(asset => asset.kind === 'bridge');
  details.push({ kind: 'bridge', pass: bridge.length === 1 && oldBridge.length === 1 && bridge[0].bootstrapSpecifierCount === 1 && oldBridge[0].bootstrapSpecifierCount === 1 && bridge[0].normalizedBootstrapSpecifierSha256 === oldBridge[0].normalizedBootstrapSpecifierSha256, comparison: 'Replace exactly one from"./index-HASH.js" bootstrap import. Every other bridge byte remains compared; no logic normalization.' });
  return details;
}
