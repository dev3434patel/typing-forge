import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile, appendFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = bytes => bytes.toString('utf8').replaceAll('\r\n', '\n');
const phpString = value => `'${String(value).replaceAll('\\', '/').replaceAll("'", "\\'")}'`;
export const fragmentPath = 'backend/opcache.ini.example';
export const fragmentSha256 = '0bd8fae150da074f7fcbdd850f1f87c7ca07d560cec45b80268fcd74ce5a7bc0';
export const extensionSha256 = '4530ffcf2c16c9fb3b97b45360302c787d5fbcb248492f80d35407f63ccff76e';

export async function configureOwnedOpcache({ root, owned, id, phpDirectory, phpIni }) {
  assert.equal(process.env.SPAROWTYPE_SOURCE33_OPCACHE_PROFILE, '1', 'A separately coordinated OPcache profile window is required.');
  assert.match(id, /^[a-f0-9]{16}$/);
  assert.equal(path.basename(owned), `pack-instance-${id}`);
  assert.equal(path.resolve(path.dirname(owned)), path.resolve(root, 'backend/storage'));
  assert.equal(path.resolve(phpIni), path.resolve(owned, 'php.ini'));
  const preparationFile = path.join(root, 'audit/2026-11-04/source33-opcache-profile-preparation-v2.json');
  const preparationBytes = await readFile(preparationFile);
  const expectedPreparation = process.env.SPAROWTYPE_SOURCE33_OPCACHE_PREPARATION_SHA256;
  assert.match(expectedPreparation ?? '', /^[a-f0-9]{64}$/, 'Bind the exact separately prepared runtime manifest.');
  assert.equal(hash(preparationBytes), expectedPreparation);
  const preparation = JSON.parse(preparationBytes);
  for (const [file, expected] of Object.entries(preparation.additionalInputHashes)) {
    assert.equal(hash(await readFile(path.join(root, file))), expected, `Prepared runtime input changed: ${file}`);
  }
  const fragment = await readFile(path.join(root, fragmentPath));
  assert.equal(hash(fragment), fragmentSha256, 'The repository-provided runtime input must remain frozen.');
  const extension = await realpath(path.join(phpDirectory, 'ext', 'php_opcache.dll'));
  assert.equal(path.dirname(extension).toLowerCase(), path.resolve(phpDirectory, 'ext').toLowerCase());
  assert.ok((await stat(extension)).isFile());
  assert.equal(hash(await readFile(extension)), extensionSha256, 'The declared installed OPcache binary must remain unchanged.');
  const sourceFile = path.join(root, 'audit/2026-11-02/final33-source.json');
  const sourceBytes = await readFile(sourceFile), source = JSON.parse(sourceBytes);
  assert.equal(hash(sourceBytes), preparation.sourceManifestSha256);
  const backend = Object.entries(source.sourceHashes).filter(([file]) => file.startsWith('backend/'));
  assert.equal(backend.length, 38);
  const rawHashes = {};
  for (const [file, expected] of backend) {
    const bytes = await readFile(path.join(root, file));
    assert.equal(hash(normalize(bytes)), expected, `Source33 backend changed: ${file}`);
    rawHashes[file] = hash(bytes);
  }
  const cacheId = `sparow_audit_${id}`;
  assert.ok(!/["\r\n]/.test(extension));
  const appended = `\n; Separate owned source33 opcode-cache profile.\nzend_extension="${extension.replaceAll('\\', '/')}"\n${fragment.toString('utf8')}\nopcache.cache_id=${cacheId}\n`;
  await appendFile(phpIni, appended);
  return {
    root, id, cacheId, rawHashes,
    publicProfile: {
      kind: 'source33-opcache-production-config-variant', ownerId: id, fragment: fragmentPath, fragmentSha256,
      fragmentOutsideFrozen505: true, additionalRuntimeInputBound: true, sourceFile: 'audit/2026-11-02/final33-source.json',
      sourceManifestSha256: hash(sourceBytes), backendFiles: backend.length,
      preparationManifestSha256: expectedPreparation, preparationRevision: 2,
      backendRawHashSetSha256: hash(JSON.stringify(rawHashes)), extensionBinarySha256: extensionSha256,
      generatedOwnedIniSha256: hash(await readFile(phpIni)),
      windowsCacheId: 'owner-specific, verified privately without returning its value',
      jitEnabled: false, persistentPdoEnabled: false, databaseOrRatePolicyChanged: false,
      ordinaryUncachedResultsReplaced: false, statsEndpointInPublicApplication: false,
    },
  };
}

export function ownedOpcacheEndpointSource({ configuration, guard }) {
  assert.match(guard, /^[a-f0-9]{64}$/);
  const expected = Object.entries(configuration.rawHashes).map(([file, digest]) => `${phpString(file)}=>${phpString(digest)}`).join(',');
  return `<?php
declare(strict_types=1);
if(PHP_SAPI!=='apache2handler'||($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1'||!hash_equals(${phpString(guard)},$_SERVER['HTTP_X_SPAROW_PROFILE_GUARD']??'')){http_response_code(404);exit;}
header('Content-Type: application/json');header('Cache-Control: no-store');
if(!function_exists('opcache_get_status')||!function_exists('opcache_get_configuration')){http_response_code(503);echo json_encode(['error'=>'opcode-cache-unavailable']);exit;}
$status=opcache_get_status(false);$configuration=opcache_get_configuration();$directives=$configuration['directives']??[];$stats=is_array($status)?($status['opcache_statistics']??[]):[];
$backendMatches=true;foreach([${expected}] as $file=>$digest){$backendMatches=$backendMatches&&hash_file('sha256',${phpString(configuration.root)}.'/'.$file)===$digest;}
$jit=(string)($directives['opcache.jit']??'');
echo json_encode([
'enabled'=>is_array($status)&&($status['opcache_enabled']??false)===true,
'timestampValidationEnabled'=>($directives['opcache.validate_timestamps']??false)===true,
'everyRequestRevalidation'=>($directives['opcache.revalidate_freq']??null)===0,
'cliDisabled'=>($directives['opcache.enable_cli']??true)===false,
'jitDisabled'=>in_array($jit,['disable','off','0',''],true)&&($directives['opcache.jit_buffer_size']??-1)===0&&!($status['jit']['on']??false),
'ownerCacheIsolationMatches'=>($directives['opcache.cache_id']??null)===${phpString(configuration.cacheId)},
'backendSourceMatches'=>$backendMatches,
'applicationIndexCached'=>opcache_is_script_cached(${phpString(path.join(configuration.root, 'backend/public/index.php'))}),
'validatorScriptCached'=>opcache_is_script_cached(${phpString(path.join(configuration.root, 'backend/src/SessionValidator.php'))}),
'arenaScriptCached'=>opcache_is_script_cached(${phpString(path.join(configuration.root, 'backend/src/ArenaEvidence.php'))}),
'cachedScripts'=>(int)($stats['num_cached_scripts']??0),
'hits'=>(int)($stats['hits']??0),'misses'=>(int)($stats['misses']??0),
'cacheFull'=>is_array($status)&&($status['cache_full']??false)===true,
'restartPending'=>is_array($status)&&($status['restart_pending']??false)===true
],JSON_THROW_ON_ERROR);
`;
}

export async function installOwnedOpcacheEndpoint({ apache, owned, configuration, guard }) {
  assert.equal(path.resolve(apache.webRoot), path.resolve(owned, 'apache-public'));
  const endpoint = path.join(apache.webRoot, '__audit-opcache.php');
  const source = ownedOpcacheEndpointSource({ configuration, guard });
  await writeFile(endpoint, source, { flag: 'wx' });
  return { generatedEndpointSha256: hash(source), endpointIsOwnedAndNotDeployed: true };
}

export async function readOwnedOpcacheSnapshot({ port, configuration, guard, stage, requirePositiveHits = true }) {
  assert.ok(Number.isInteger(port) && port > 1024 && ![3306,3307,3308,8081,4173].includes(port));
  const response = await fetch(`http://127.0.0.1:${port}/__audit-opcache.php`, { headers: { 'X-Sparow-Profile-Guard': guard }, signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200, 'The isolated runtime must actually expose active OPcache; no uncached fallback pass.');
  const snapshot = await response.json();
  const keys = ['enabled','timestampValidationEnabled','everyRequestRevalidation','cliDisabled','jitDisabled','ownerCacheIsolationMatches','backendSourceMatches','applicationIndexCached','validatorScriptCached','arenaScriptCached','cachedScripts','hits','misses','cacheFull','restartPending'];
  assert.deepEqual(Object.keys(snapshot).sort(), [...keys].sort(), 'Only bounded stats/booleans may be returned, never paths/configuration values.');
  for (const key of keys.slice(0, 7)) assert.equal(snapshot[key], true, `Required runtime control: ${key}`);
  assert.equal(snapshot.applicationIndexCached, true, 'The application entry point must actually be opcode-cached.');
  for (const key of ['validatorScriptCached','arenaScriptCached']) assert.equal(typeof snapshot[key], 'boolean');
  if (stage.startsWith('after-capacity')) {
    assert.equal(snapshot.validatorScriptCached, true, 'The actual validator must be cached after the workload.');
    assert.equal(snapshot.arenaScriptCached, true, 'The actual Arena implementation must be cached after the workload.');
  }
  for (const key of ['cachedScripts','hits','misses']) assert.ok(Number.isInteger(snapshot[key]) && snapshot[key] >= 0);
  assert.ok(snapshot.cachedScripts > 0, 'Actual compiled scripts must be cached.');
  if (requirePositiveHits) assert.ok(snapshot.hits > 0, 'At least one real opcode-cache hit must be observed.');
  return { recordedAt: new Date().toISOString(), stage, ownerId: configuration.id, ...configuration.publicProfile, ...snapshot, requirePositiveHits };
}

export async function verifyOpcodeProfileReceipt({ ownerId, receiptPath, expectedFragment = fragmentSha256, allowColdStart = false }) {
  assert.equal(process.env.SPAROWTYPE_SOURCE33_OPCACHE_PROFILE, '1');
  assert.equal(path.dirname(path.resolve(receiptPath)), path.resolve('audit/2026-11-02'));
  assert.match(path.basename(receiptPath), new RegExp(`^pack-backend-${ownerId}-opcache-[a-z0-9-]+\\.json$`));
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  assert.equal(receipt.ownerId, ownerId);
  assert.equal(receipt.kind, 'source33-opcache-production-config-variant');
  assert.equal(receipt.preparationRevision, 2);
  assert.equal(receipt.preparationManifestSha256, process.env.SPAROWTYPE_SOURCE33_OPCACHE_PREPARATION_SHA256);
  assert.equal(receipt.fragmentSha256, expectedFragment);
  assert.equal(hash(await readFile(fragmentPath)), expectedFragment);
  for (const key of ['enabled','timestampValidationEnabled','everyRequestRevalidation','cliDisabled','jitDisabled','ownerCacheIsolationMatches','backendSourceMatches']) assert.equal(receipt[key], true);
  assert.equal(receipt.applicationIndexCached, true);
  assert.equal(receipt.stage, allowColdStart ? 'before-capacity33-opcache-v2' : 'before-capacity33-opcache-v2-wire');
  assert.ok(receipt.cachedScripts > 0 && receipt.hits >= 0);
  assert.equal(receipt.requirePositiveHits, !allowColdStart);
  if (!allowColdStart) assert.ok(receipt.hits > 0);
  return receipt;
}
