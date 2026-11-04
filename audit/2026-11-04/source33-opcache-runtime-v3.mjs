import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile, appendFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { source as diagnosticSource } from './source33-opcache-cache-probe-endpoint.mjs';
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
  const preparationFile = path.join(root, 'audit/2026-11-04/source33-opcache-profile-preparation-v3.json');
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
      preparationManifestSha256: expectedPreparation, preparationRevision: 3,
      backendRawHashSetSha256: hash(JSON.stringify(rawHashes)), extensionBinarySha256: extensionSha256,
      generatedOwnedIniSha256: hash(await readFile(phpIni)),
      windowsCacheId: 'owner-specific, verified privately without returning its value',
      jitEnabled: false, persistentPdoEnabled: false, databaseOrRatePolicyChanged: false,
      ordinaryUncachedResultsReplaced: false, statsEndpointInPublicApplication: false,
    },
  };
}

export function ownedOpcacheEndpointSource({configuration,guard}) { return diagnosticSource(configuration,guard); }

export async function installOwnedOpcacheEndpoint({ apache, owned, configuration, guard }) {
  assert.equal(path.resolve(apache.webRoot), path.resolve(owned, 'apache-public'));
  const endpoint = path.join(apache.webRoot, '__audit-opcache.php');
  const source = ownedOpcacheEndpointSource({ configuration, guard });
  await writeFile(endpoint, source, { flag: 'wx' });
  return { generatedEndpointSha256: hash(source), endpointIsOwnedAndNotDeployed: true };
}

export async function readOwnedOpcacheSnapshot({port,configuration,guard,stage,requirePositiveHits=true}) {
  assert.ok(Number.isInteger(port)&&port>1024&&![3306,3307,3308,8081,4173].includes(port));
  const response=await fetch(`http://127.0.0.1:${port}/__audit-opcache.php`,{headers:{'X-Sparow-Profile-Guard':guard},signal:AbortSignal.timeout(5000)});
  const snapshot=await response.json();
  const safe=(value,depth=0)=>depth<10&&(value===null||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value))||(value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(child=>safe(child,depth+1))));
  assert.ok(safe(snapshot),'Only bounded booleans/counts may leave the owned status endpoint');
  // Always persist failed proof facts before any cache/control assertion.
  await writeFile(path.join(configuration.root,`audit/2026-11-02/pack-backend-${configuration.id}-opcache-raw-${stage}.json`),JSON.stringify({recordedAt:new Date().toISOString(),stage,ownerId:configuration.id,httpStatus:response.status,...configuration.publicProfile,facts:snapshot},null,2)+'\n',{flag:'wx'});
  assert.equal(response.status,200);
  assert.equal(snapshot.backendFilesChecked,38);assert.equal(snapshot.backendSourceMatches,true);
  assert.ok(Object.values(snapshot.controls).every(value=>value===true));assert.equal(snapshot.cliDisabled,true);
  assert.equal(snapshot.cacheFull,false);assert.equal(snapshot.restartPending,false);assert.equal(snapshot.restartInProgress,false);
  const assertScript=script=>{assert.equal(script.lookupRealpath,true);assert.equal(script.metadataFullPathMatches,true);assert.equal(script.sourceHashMatches,true);assert.equal(script.metadataMtimeMatchesCurrent,true);};
  assertScript(snapshot.scripts.applicationIndex);
  if(stage.startsWith('after-capacity')||stage.startsWith('before-arena')||stage.startsWith('after-arena')) {assertScript(snapshot.scripts.validator);assertScript(snapshot.scripts.arena);}
  assert.ok(snapshot.cachedScripts>0&&Number.isInteger(snapshot.hits)&&snapshot.hits>=0);
  if(requirePositiveHits)assert.ok(snapshot.hits>0);
  return {recordedAt:new Date().toISOString(),stage,ownerId:configuration.id,...configuration.publicProfile,
   enabled:snapshot.controls.cacheEnabled,timestampValidationEnabled:snapshot.controls.timestampValidationEnabled,everyRequestRevalidation:snapshot.controls.everyRequestRevalidation,
   cliDisabled:snapshot.cliDisabled,jitDisabled:snapshot.controls.jitDisabled,ownerCacheIsolationMatches:snapshot.controls.ownerCacheIsolationMatches,backendSourceMatches:snapshot.backendSourceMatches,
   applicationIndexCached:snapshot.scripts.applicationIndex.lookupRealpath,validatorScriptCached:snapshot.scripts.validator.lookupRealpath,arenaScriptCached:snapshot.scripts.arena.lookupRealpath,
   cachedScripts:snapshot.cachedScripts,hits:snapshot.hits,misses:snapshot.misses,cacheFull:snapshot.cacheFull,restartPending:snapshot.restartPending,
   cachePathProof:snapshot.scripts,ownedIniHashMatched:snapshot.controls.ownedIniMatches,requirePositiveHits,
   proofMethod:'Canonical realpath cache query AND full-root/file metadata AND frozen source SHA/mtime; original forward-query facts retained. No filename-only matching.'};
}

export async function verifyOpcodeProfileReceipt({ ownerId, receiptPath, expectedFragment = fragmentSha256, allowColdStart = false }) {
  assert.equal(process.env.SPAROWTYPE_SOURCE33_OPCACHE_PROFILE, '1');
  assert.equal(path.dirname(path.resolve(receiptPath)), path.resolve('audit/2026-11-02'));
  assert.match(path.basename(receiptPath), new RegExp(`^pack-backend-${ownerId}-opcache-[a-z0-9-]+\\.json$`));
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  assert.equal(receipt.ownerId, ownerId);
  assert.equal(receipt.kind, 'source33-opcache-production-config-variant');
  assert.equal(receipt.preparationRevision, 3);
  assert.equal(receipt.preparationManifestSha256, process.env.SPAROWTYPE_SOURCE33_OPCACHE_PREPARATION_SHA256);
  assert.equal(receipt.fragmentSha256, expectedFragment);
  assert.equal(hash(await readFile(fragmentPath)), expectedFragment);
  for (const key of ['enabled','timestampValidationEnabled','everyRequestRevalidation','cliDisabled','jitDisabled','ownerCacheIsolationMatches','backendSourceMatches']) assert.equal(receipt[key], true);
  assert.equal(receipt.applicationIndexCached, true);
  assert.equal(receipt.stage, allowColdStart ? 'before-capacity33-opcache-v3' : 'before-capacity33-opcache-v3-wire');
  assert.ok(receipt.cachedScripts > 0 && receipt.hits >= 0);
  assert.equal(receipt.requirePositiveHits, !allowColdStart);
  if (!allowColdStart) assert.ok(receipt.hits > 0);
  return receipt;
}
