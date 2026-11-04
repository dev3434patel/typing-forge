import assert from 'node:assert/strict';
import path from 'node:path';
import { realpath, writeFile } from 'node:fs/promises';

const literal = value => {
  assert.ok(!/[\0\r\n]/.test(value));
  return `'${value.replaceAll('\\', '/').replaceAll("'", "\\'")}'`;
};
export function source31SqlProfileWrapperSource(actualConfig, profileRoot) {
  return String.raw`<?php
declare(strict_types=1);
$sqlProfileStarted = hrtime(true);
$sqlProfileExpectedConfig = ${literal(actualConfig)};
$sqlProfileActualConfig = getenv('SPAROWTYPE_CONFIG_FILE');
// Fail before bootstrap/session/database work if the exact owned config is absent.
if (!is_string($sqlProfileActualConfig) || str_replace(chr(92), '/', realpath($sqlProfileActualConfig) ?: '') !== $sqlProfileExpectedConfig) {
    http_response_code(503);
    exit;
}
require ${literal(path.join(profileRoot, 'sql-profile-runtime.php'))};
\SparowTypeAudit\SqlProfile::begin($sqlProfileStarted);
ob_start();
try { require ${literal(path.join(profileRoot, 'backend/public/index.php'))}; }
finally {
    \SparowTypeAudit\SqlProfile::emit();
    ob_end_flush();
}
`;
}
export async function writeSource31SqlProfileWrapper({ webRoot, owned, configFile, profileRoot, root, ownerId }) {
  assert.match(ownerId, /^[a-f0-9]{16}$/);
  const actualOwned = await realpath(owned);
  assert.equal(actualOwned, path.join(await realpath(path.join(root, 'backend/storage')), `pack-instance-${ownerId}`));
  const actualConfig = await realpath(configFile);
  assert.equal(actualConfig, path.join(actualOwned, 'app-config.php'));
  assert.equal(await realpath(webRoot), path.join(actualOwned, 'apache-public'));
  assert.equal(await realpath(profileRoot), path.join(root, 'audit/2026-11-02/.final31-sql-profile'));
  await writeFile(path.join(webRoot, 'index.php'), source31SqlProfileWrapperSource(actualConfig, profileRoot));
  return { wrapper: path.join(webRoot, 'index.php'), ownedConfigGuardedBeforeBootstrap: true, outputBuffering: 'Diagnostic single-JSON-response buffering only, required to append timing headers before flush.' };
}
