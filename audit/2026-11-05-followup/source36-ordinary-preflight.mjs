import assert from 'node:assert/strict';
import {readFile,stat}from'node:fs/promises';
import {createHash}from'node:crypto';
import {verifyFrozenSource}from'../2026-10-21/artifact-verification.mjs';
const directory='audit/2026-11-05-followup';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const ordinary36RuntimeFiles=[
  `${directory}/pack-capacity-instance-source36.mjs`,`${directory}/pack-capacity-instance-source36-wire.mjs`,
  `${directory}/run-source36-capacity-burst.mjs`,`${directory}/run-source36-capacity-wire-burst.mjs`,
  `${directory}/run-source36-native-rate.mjs`,`${directory}/native-rate-worker-source36.php`,
  `${directory}/source36-ordinary-preflight.mjs`,'backend/tests/arena-audit-admin.php','scripts/php-runtime.mjs','audit/2026-10-21/pack-apache-runtime.mjs',
];
export const ordinary36RequiredInputs=[...ordinary36RuntimeFiles,
  `${directory}/final36-source.json`,'dist/offline-build.json','audit/2026-10-21/artifact-verification.mjs',
  'src/lib/typing-core/index.ts','src/domain/arena.ts','src/services/arena-service.ts','src/domain/__tests__/arena.test.ts','backend/tests/validation-parity.mjs',
  'backend/tests/password-policy.php','backend/tests/pack-progression-lifecycle.mjs','backend/tests/pack-social-lifecycle.mjs','backend/tests/classroom-lifecycle.mjs','backend/tests/data-lifecycle.mjs','backend/tests/course-lifecycle.mjs','backend/tests/race-lifecycle.mjs',
  'audit/mega-pack-2026-10-21/run-arena-load.mjs','audit/mega-pack-2026-10-21/run-arena-http.mjs',
  'C:/xampp/apache/bin/httpd.exe','C:/xampp/mysql/bin/mysql_install_db.exe','C:/xampp/mysql/bin/mysqld.exe','C:/xampp/php/php.exe','C:/xampp/php/php8apache2_4.dll','C:/xampp/php/php8ts.dll','C:/xampp/php/ext/php_intl.dll','C:/xampp/php/ext/php_mbstring.dll','C:/xampp/php/ext/php_pdo_mysql.dll',
];
export async function filesystemSource36Preflight(expectedBuild){
  assert.match(expectedBuild??'',/^[a-f0-9]{20}$/);
  const paths=[];
  for(const file of[...new Set(ordinary36RequiredInputs)].sort()){const info=await stat(file);assert.equal(info.isFile(),true,`Required ordinary36 helper/input: ${file}`);paths.push(file);}
  const source=await verifyFrozenSource(`${directory}/final36-source.json`);assert.equal(source.receipt.compared,506);assert.deepEqual(source.receipt.mismatches,[]);assert.equal(source.frozen.local.version,expectedBuild);
  const build=JSON.parse(await readFile('dist/offline-build.json'));assert.deepEqual(build,source.frozen.local);
  assert.equal(source.frozen.sourceHashes['backend/src/Database.php'],'38e67995661448fb80af94ae81acc2fc844b5ecea15c6313d6fc87135681acb0','Native PDO/prepare/persistence/UTC policy stays unchanged.');
  const producer=Object.keys(source.frozen.sourceHashes).filter(file=>file.startsWith('src/lib/typing-core/')||['src/domain/arena.ts','src/services/arena-service.ts'].includes(file));
  assert.equal(producer.length,18); // Source36 includes the additional core regression-test source.
  const runtimeInputs=Object.fromEntries(await Promise.all(ordinary36RuntimeFiles.map(async file=>[file,sha(await readFile(file))])));
  return{source:source.receipt,sourceManifestSha256:sha(await readFile(`${directory}/final36-source.json`)),build,producerDependenciesVerified:producer.length,requiredPaths:paths,runtimeInputs,servicesStarted:0,privateOriginalConfigurationRead:false};
}
export async function verifyPreparedOrdinarySource36(){
  const file=`${directory}/source36-ordinary-capacity-preparation-v3.json`,bytes=await readFile(file),plan=JSON.parse(bytes);
  assert.match(process.env.SPAROWTYPE_SOURCE36_CAPACITY_PREPARATION_SHA256??'',/^[a-f0-9]{64}$/);
  assert.equal(sha(bytes),process.env.SPAROWTYPE_SOURCE36_CAPACITY_PREPARATION_SHA256,'Bind the independently reviewed v3 preparation before starting any native process.');
  const actual=await filesystemSource36Preflight(process.env.SPAROWTYPE_FINAL36_BUILD_ID);
  assert.deepEqual(actual.runtimeInputs,plan.preflight.runtimeInputs);assert.equal(actual.sourceManifestSha256,plan.preflight.sourceManifestSha256);
  return actual;
}
