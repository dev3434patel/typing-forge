import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const literal = value => {
  assert.ok(typeof value === 'string' && value.length > 0 && !/[\0\r\n]/.test(value), 'Expected a bounded path literal.');
  return `'${value.replaceAll('\\', '/').replaceAll("'", "\\'")}'`;
};
const expectedIndex = {
  A: '92382a84ac652b38198711bc86973245a6a6dbc4af0aeaefb796ee0267618d76',
  B: 'f02f477750838614113cf0900143a79218dfc8299b1cb963aab570b7f6683c84',
};
const sourceFiles = {
  A: 'backend/tests/lazy-services/reference/backend/public/index.php',
  B: 'backend/public/index.php',
};
const manifestFile = 'audit/2026-11-05-followup/final36-source.json';

async function productionIdentity(root) {
  const bytes = await readFile(path.join(root, manifestFile));
  const manifest = JSON.parse(bytes);
  const entries = Object.entries(manifest.sourceHashes ?? {});
  assert.equal(entries.length, 506, 'The declared source36 production identity must contain 506 files.');
  for (const [file, expected] of entries) {
    assert.ok(!path.isAbsolute(file) && !file.split('/').includes('..'));
    assert.equal(normalizedSourceHash(file, await readFile(path.join(root, file))), expected, `Frozen source36 changed: ${file}`);
  }
  return { sourceFile: manifestFile, manifestSha256: sha256(bytes), compared: entries.length, mismatches: [], build: manifest.local.version };
}
async function exactFile(file, bytes) {
  try { await writeFile(file, bytes, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; assert.equal((await lstat(file)).isSymbolicLink(), false); assert.equal(sha256(await readFile(file)), sha256(bytes), 'An existing prepared copy must match exactly.'); }
}

/** File preparation only. Both copies retain all current primary backend classes. */
export async function prepareIndexAbbaCopies({ root, indexRoot }) {
  const actualRoot = await realpath(root);
  const expectedRoot = path.join(actualRoot, 'audit/2026-11-05-followup/.final-index-abba');
  assert.equal(path.resolve(indexRoot), expectedRoot);
  const before = await productionIdentity(actualRoot);
  try { await mkdir(expectedRoot, { recursive: false }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  assert.equal(await realpath(expectedRoot), expectedRoot);
  assert.equal((await lstat(expectedRoot)).isSymbolicLink(), false);
  const bootstrap = path.join(actualRoot, 'backend/bootstrap.php');
  assert.equal(await realpath(bootstrap), bootstrap);
  const from = "dirname(__DIR__).'/bootstrap.php'", to = literal(bootstrap);
  const copies = {};
  for (const variant of ['A', 'B']) {
    const source = await readFile(path.join(actualRoot, sourceFiles[variant]));
    assert.equal(sha256(source), expectedIndex[variant], `Declared index${variant} changed.`);
    const original = source.toString('utf8');
    assert.equal(original.split(from).length, 2, 'The bootstrap require expression must occur exactly once.');
    const copy = original.replace(from, to);
    assert.equal(copy.split(to).length, 2);
    assert.equal(copy.replace(to, from), original, 'Exact bootstrap-only reversal is required.');
    const file = path.join(expectedRoot, `index-${variant}.php`);
    await exactFile(file, copy);
    copies[variant] = { source: sourceFiles[variant], sourceSha256: sha256(source), copy: path.relative(actualRoot, file).replaceAll('\\', '/'), copySha256: sha256(copy), bootstrapOnlyExactReverse: true, replacementCount: 1 };
  }
  const after = await productionIdentity(actualRoot);
  assert.deepEqual(after, before);
  return { indexRoot: expectedRoot, copies, productionBefore: before, productionAfter: after, currentBackendShared: true, bootstrapSha256: sha256(await readFile(bootstrap)), preparationOnly: true, phpExecuted: false };
}

/** Contains the nonce: write only to the private, newly owned web shim. */
export function indexAbbaShimSource({ actualConfig, owned, root, ownerId, nonce, indexRoot, runnerPid = process.pid }) {
  assert.ok(typeof nonce === 'string' && /^[a-f0-9]{64}$/.test(nonce), 'A private64-hex owned nonce is required.');
  assert.ok(/^[a-f0-9]{16}$/.test(ownerId), 'An exact owner identifier is required.');
  assert.ok(Number.isInteger(runnerPid) && runnerPid > 0);
  assert.equal(path.resolve(owned), path.join(root, 'backend/storage', `pack-instance-${ownerId}`));
  assert.equal(path.resolve(actualConfig), path.join(owned, 'app-config.php'));
  assert.equal(path.resolve(indexRoot), path.join(root, 'audit/2026-11-05-followup/.final-index-abba'));
  return String.raw`<?php
declare(strict_types=1);
$indexAuditNormalize = static fn(string $value): string => str_replace(chr(92), '/', $value);
$indexAuditConfig = getenv('SPAROWTYPE_CONFIG_FILE');
if (PHP_SAPI !== 'apache2handler' || ($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1' || !is_string($indexAuditConfig) || $indexAuditNormalize(realpath($indexAuditConfig) ?: '') !== ${literal(actualConfig)}) {
    http_response_code(503);
    exit;
}
$indexAuditOwner = json_decode(@file_get_contents(${literal(path.join(owned, 'ownership.json'))}) ?: '', true);
if (!is_array($indexAuditOwner) || ($indexAuditOwner['id'] ?? null) !== '${ownerId}' || ($indexAuditOwner['runnerPid'] ?? null) !== ${runnerPid} || !is_string($indexAuditOwner['root'] ?? null) || $indexAuditNormalize(realpath($indexAuditOwner['root']) ?: '') !== ${literal(root)}) {
    http_response_code(503);
    exit;
}
$indexAuditSelector = $_SERVER['HTTP_X_SPAROWTYPE_AUDIT_INDEX'] ?? null;
if ($indexAuditSelector === null) {
    $indexAuditPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' || !in_array($indexAuditPath, ['/api/health', '/api/auth/session'], true)) {
        http_response_code(403);
        exit;
    }
    $indexAuditVariant = 'B';
} elseif (is_string($indexAuditSelector) && strlen($indexAuditSelector) === 66 && $indexAuditSelector[64] === ':' && in_array($indexAuditSelector[65], ['A', 'B'], true) && hash_equals('${nonce}', substr($indexAuditSelector, 0, 64))) {
    $indexAuditVariant = $indexAuditSelector[65];
} else {
    http_response_code(403);
    exit;
}
header('X-SparowType-Audit-Index: '.$indexAuditVariant);
if ($indexAuditVariant === 'A') require ${literal(path.join(indexRoot, 'index-A.php'))};
else require ${literal(path.join(indexRoot, 'index-B.php'))};
`;
}

export async function writeIndexAbbaShim({ webRoot, owned, configFile, root, ownerId, nonce, indexRoot }) {
  assert.ok(typeof nonce === 'string' && /^[a-f0-9]{64}$/.test(nonce), 'A private64-hex owned nonce is required.');
  assert.match(ownerId, /^[a-f0-9]{16}$/);
  const actualRoot = await realpath(root), actualOwned = await realpath(owned);
  assert.equal(actualOwned, path.join(await realpath(path.join(actualRoot, 'backend/storage')), `pack-instance-${ownerId}`));
  assert.equal((await lstat(owned)).isSymbolicLink(), false);
  const markerFile = path.join(actualOwned, 'ownership.json');
  assert.equal((await lstat(markerFile)).isSymbolicLink(), false);
  const marker = JSON.parse(await readFile(markerFile, 'utf8'));
  assert.equal(marker.id, ownerId); assert.equal(marker.runnerPid, process.pid); assert.equal(await realpath(marker.root), actualRoot);
  const actualConfig = await realpath(configFile), actualWebRoot = await realpath(webRoot), actualIndexRoot = await realpath(indexRoot);
  assert.equal(actualConfig, path.join(actualOwned, 'app-config.php'));
  assert.equal(actualWebRoot, path.join(actualOwned, 'apache-public'));
  assert.equal(actualIndexRoot, path.join(actualRoot, 'audit/2026-11-05-followup/.final-index-abba'));
  assert.equal((await lstat(indexRoot)).isSymbolicLink(), false);
  const copies = {};
  for (const variant of ['A', 'B']) {
    const file = path.join(actualIndexRoot, `index-${variant}.php`);
    assert.equal(await realpath(file), file); assert.equal((await lstat(file)).isSymbolicLink(), false);
    const original = await readFile(path.join(actualRoot, sourceFiles[variant]));
    assert.equal(sha256(original), expectedIndex[variant]);
    const copy = await readFile(file), expected = original.toString('utf8').replace("dirname(__DIR__).'/bootstrap.php'", literal(path.join(actualRoot, 'backend/bootstrap.php')));
    assert.equal(copy.toString('utf8'), expected, 'Only the predeclared bootstrap expression may differ.');
    copies[variant] = sha256(copy);
  }
  const wrapper = path.join(actualWebRoot, 'index.php');
  assert.equal((await lstat(wrapper)).isSymbolicLink(), false);
  assert.equal((await lstat(wrapper)).isFile(), true);
  const source = indexAbbaShimSource({ actualConfig, owned: actualOwned, root: actualRoot, ownerId, nonce, indexRoot: actualIndexRoot });
  await writeFile(wrapper, source);
  return { generatedShimSha256: sha256(source), nonceSha256: sha256(nonce), indexCopySha256: copies, requestHeader: 'X-SparowType-Audit-Index', responseHeader: 'X-SparowType-Audit-Index', readinessWithoutNonce: 'Only GET /api/health or GET /api/auth/session; defaults to B', ownedMarkerAndConfigGuardBeforeBootstrap: true, noProfilerOrClassMap: true, currentBackendShared: true };
}
