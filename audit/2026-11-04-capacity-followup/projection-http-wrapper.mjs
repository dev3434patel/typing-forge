import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const literal = value => {
  assert.equal(typeof value, 'string');
  assert.ok(value.length > 0 && !/[\0\r\n]/.test(value));
  return `'${value.replaceAll('\\', '/').replaceAll("'", "\\'")}'`;
};

/** Generate an owned-only shim. It never loads the primary backend/config.php. */
export function projectionHttpWrapperSource(actualConfig, profileRoot) {
  const owned = path.dirname(actualConfig);
  const ownerId = path.basename(owned).match(/^pack-instance-([a-f0-9]{16})$/)?.[1];
  assert.ok(ownerId, 'An exact isolated owner identity is required.');
  assert.equal(path.basename(actualConfig), 'app-config.php');
  assert.equal(path.basename(profileRoot), '.final-projection-http-clone');
  assert.equal(path.basename(path.dirname(profileRoot)), '2026-11-04-capacity-followup');
  const primaryRoot = path.resolve(profileRoot, '../../..');
  assert.equal(path.resolve(owned), path.join(primaryRoot, 'backend/storage', `pack-instance-${ownerId}`));
  return String.raw`<?php
declare(strict_types=1);
$projectionStarted = hrtime(true);
$projectionNormalize = static fn(string $value): string => str_replace(chr(92), '/', $value);
$projectionExpectedConfig = ${literal(actualConfig)};
$projectionActualConfig = getenv('SPAROWTYPE_CONFIG_FILE');
// Fail before bootstrap, session or database access; export no private identity.
if (PHP_SAPI !== 'apache2handler' || ($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1' || !is_string($projectionActualConfig) || $projectionNormalize(realpath($projectionActualConfig) ?: '') !== $projectionExpectedConfig) {
    http_response_code(503);
    exit;
}
$projectionOwnership = json_decode(@file_get_contents(${literal(path.join(owned, 'ownership.json'))}) ?: '', true);
if (!is_array($projectionOwnership) || ($projectionOwnership['id'] ?? null) !== '${ownerId}' || ($projectionOwnership['runnerPid'] ?? null) !== ${process.pid} || !is_string($projectionOwnership['root'] ?? null) || $projectionNormalize(realpath($projectionOwnership['root']) ?: '') !== ${literal(primaryRoot)}) {
    http_response_code(503);
    exit;
}
$projectionVariant = $_SERVER['HTTP_X_SPAROWTYPE_ARENA_PROJECTION'] ?? 'baseline';
if (!is_string($projectionVariant) || !in_array($projectionVariant, ['baseline', 'candidate'], true)) {
    http_response_code(400);
    exit;
}
if (class_exists('SparowType\\ArenaService', false) || class_exists('SparowType\\ArenaServiceProjectionCandidate', false)) {
    http_response_code(503);
    exit;
}
require ${literal(path.join(profileRoot, 'projection-sql-profile-runtime.php'))};
\SparowTypeAudit\SqlProfile::begin($projectionStarted, $projectionVariant);
header('X-SparowType-Arena-Projection: '.$projectionVariant);
header('X-SparowType-Arena-Projection-Guard: owned-v1');
ob_start();
try {
    \SparowTypeAudit\SqlProfile::stage('variant_load', static function () use ($projectionVariant): void {
        if ($projectionVariant === 'candidate') {
            require ${literal(path.join(profileRoot, 'backend/src/ArenaServiceProjectionCandidate.php'))};
            if (!class_alias('SparowType\\ArenaServiceProjectionCandidate', 'SparowType\\ArenaService', false)) throw new RuntimeException('Diagnostic projection alias failed.');
        } else require ${literal(path.join(profileRoot, 'backend/src/ArenaService.php'))};
    });
    require ${literal(path.join(profileRoot, 'backend/public/index.php'))};
} finally {
    \SparowTypeAudit\SqlProfile::emit();
    ob_end_flush();
}
`;
}

/** Replace only the new owned web shim after verifying its existing owner marker. */
export async function writeProjectionHttpWrapper({ webRoot, owned, configFile, profileRoot, root, ownerId }) {
  assert.match(ownerId, /^[a-f0-9]{16}$/);
  const actualRoot = await realpath(root);
  const actualOwned = await realpath(owned);
  assert.equal(actualOwned, path.join(await realpath(path.join(actualRoot, 'backend/storage')), `pack-instance-${ownerId}`));
  assert.equal((await lstat(owned)).isSymbolicLink(), false);
  const ownershipFile = path.join(actualOwned, 'ownership.json');
  assert.equal((await lstat(ownershipFile)).isSymbolicLink(), false);
  const ownership = JSON.parse(await readFile(ownershipFile, 'utf8'));
  assert.equal(ownership.id, ownerId);
  assert.equal(ownership.runnerPid, process.pid, 'Only the owning controller may install the diagnostic shim.');
  assert.equal(await realpath(ownership.root), actualRoot);
  const actualConfig = await realpath(configFile);
  assert.equal(actualConfig, path.join(actualOwned, 'app-config.php'));
  const actualWebRoot = await realpath(webRoot);
  assert.equal(actualWebRoot, path.join(actualOwned, 'apache-public'));
  const actualProfile = await realpath(profileRoot);
  assert.equal(actualProfile, path.join(actualRoot, 'audit/2026-11-04-capacity-followup/.final-projection-http-clone'));
  assert.equal((await lstat(profileRoot)).isSymbolicLink(), false);
  for (const relative of ['projection-sql-profile-runtime.php', 'backend/public/index.php', 'backend/src/ArenaService.php', 'backend/src/ArenaServiceProjectionCandidate.php']) {
    const file = path.join(actualProfile, relative);
    assert.equal(await realpath(file), file);
    const info = await lstat(file);
    assert.equal(info.isSymbolicLink(), false);
    assert.equal(info.isFile(), true);
  }
  const wrapper = path.join(actualWebRoot, 'index.php');
  const previous = await lstat(wrapper);
  assert.equal(previous.isSymbolicLink(), false);
  assert.equal(previous.isFile(), true);
  const source = projectionHttpWrapperSource(actualConfig, actualProfile);
  await writeFile(wrapper, source);
  return {
    wrapper, wrapperSha256: sha256(source),
    ownedConfigGuardedBeforeBootstrap: true, ownershipMarkerGuardedBeforeBootstrap: true,
    cloneRootGuarded: true, requestVariantHeader: 'X-SparowType-Arena-Projection',
    responseVariantHeader: 'X-SparowType-Arena-Projection', responseGuardHeader: 'X-SparowType-Arena-Projection-Guard',
    defaultVariant: 'baseline', profileMarker: 35,
    sourceHashIdentity: 'Bind and verify primary, clone, candidate, helper and shim hashes in the independent preparation manifest before and after the owned window.',
    outputBuffering: 'Diagnostic single-JSON-response buffering only, required to emit bounded timing headers before flush.',
  };
}
