import assert from 'node:assert/strict';
import path from 'node:path';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { normalizedSourceHash } from '../2026-10-21/artifact-verification.mjs';
const directory = 'audit/2026-11-04-capacity-followup';
const cloneRoot = path.resolve(directory, '.final-projection-http-clone');
const sha = value => createHash('sha256').update(value).digest('hex');
const candidateFile = `${directory}/ArenaServiceCachedCandidate.php`;
const manifestFile = `${directory}/owned-arena-diagnostic-preparation.json`;
await assert.rejects(access(manifestFile), { code: 'ENOENT' });
const pureReceipt = JSON.parse(await readFile(`${directory}/arena-member-cache-pure-result.json`));
assert.equal(pureReceipt.status, 'PASS-SCOPED-PURE'); assert.equal(pureReceipt.source505Unchanged, true); assert.equal(pureReceipt.inputsUnchanged, true);
assert.equal(spawnSync('git', ['check-ignore','--quiet',path.join(cloneRoot,'marker')], { windowsHide:true }).status, 0, 'The source clone must stay ignored without changing primary Git rules.');
const frozen = JSON.parse(await readFile('audit/2026-11-02/final34-source.json'));
const rawHashes = {}, authorizedDifferences = [];
for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
  const bytes = await readFile(file); rawHashes[file] = sha(bytes);
  if (normalizedSourceHash(file, bytes) !== expected) authorizedDifferences.push(file);
}
assert.ok(authorizedDifferences.every(file => file === 'src/pages/Profile.tsx'), 'Only the separately authorized Profile change may accompany this preclinical snapshot.');
const producerFiles = Object.keys(frozen.sourceHashes).filter(file => file.startsWith('src/lib/typing-core/') || ['src/domain/arena.ts', 'src/services/arena-service.ts'].includes(file)).sort();
const producerDependencies = {};
for (const file of producerFiles) { const bytes = await readFile(file); assert.equal(normalizedSourceHash(file,bytes),frozen.sourceHashes[file]); producerDependencies[file] = sha(bytes); }
const cloneFiles = [], transforms = [];
async function exactFile(relative, contents) { const target = path.join(cloneRoot, relative); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, contents, { flag: 'wx' }); cloneFiles.push({ relative: relative.replaceAll('\\','/'), sha256: sha(contents) }); }
function transform(file, original, apply) {
  const eol = original.includes('\r\n') ? '\r\n' : '\n'; let value = original; const edits = [];
  const replace = (before, after, expectedCount = 1) => { before=before.replaceAll('\n',eol);after=after.replaceAll('\n',eol);assert.equal(value.split(before).length-1,expectedCount,`Exact diagnostic boundary ${file}: ${before}`);value=value.replaceAll(before,after);edits.push({before,after,count:expectedCount}); };
  apply(replace); let reversed = value; for(const edit of [...edits].reverse())reversed=reversed.replaceAll(edit.after,edit.before);assert.equal(reversed,original,`Exact diagnostic reversal ${file}`);
  transforms.push({ file, originalSha256: sha(original), diagnosticSha256: sha(value), edits, exactReversal: true }); return value;
}
for (const file of Object.keys(frozen.sourceHashes).filter(file=>file.startsWith('backend/')).sort()) {
  const bytes = await readFile(file); assert.equal(normalizedSourceHash(file,bytes),frozen.sourceHashes[file]); let value=bytes.toString('utf8');
  if(file==='backend/src/Database.php') value=transform(file,value,replace=>replace('$pdo = new PDO(', '$pdo = new \\SparowTypeAudit\\ProfiledPDO('));
  if(file==='backend/public/index.php') value=transform(file,value,replace=>{
    replace("$config = require dirname(__DIR__).'/bootstrap.php';", "$config = \\SparowTypeAudit\\SqlProfile::stage('bootstrap', static fn() => require dirname(__DIR__).'/bootstrap.php');");
    replace('Security::beginSession($config);', "\\SparowTypeAudit\\SqlProfile::stage('session', static fn() => Security::beginSession($config));");
    replace('$db = Database::connect($config);', "$db = \\SparowTypeAudit\\SqlProfile::stage('connect', static fn() => Database::connect($config));");
    replace('$auth = new AuthService($db, $config);', "$auth = \\SparowTypeAudit\\SqlProfile::stage('auth_construct', static fn() => new AuthService($db, $config));");
    replace('$validator = new SessionValidator();', "$validator = \\SparowTypeAudit\\SqlProfile::stage('validator_construct', static fn() => new SessionValidator());");
    replace('$data = new DataService($db, $validator, $config);', "$data = \\SparowTypeAudit\\SqlProfile::stage('data_construct', static fn() => new DataService($db, $validator, $config));");
    replace('$arenaUser = Security::apiRate($db, $config, $auth, $arenaAction !== null);', "$arenaUser = \\SparowTypeAudit\\SqlProfile::stage('auth_rate', static fn() => Security::apiRate($db, $config, $auth, $arenaAction !== null));");
    replace("$raw = stream_get_contents($stream, (int) $config['max_body_bytes'] + 1);", "$raw = \\SparowTypeAudit\\SqlProfile::stage('body_read', static fn() => stream_get_contents($stream, (int) $config['max_body_bytes'] + 1));");
    replace('$body = RequestBody::decode($raw);', "$body = \\SparowTypeAudit\\SqlProfile::stage('json_decode', static fn() => RequestBody::decode($raw));");
    replace('$result = (new ArenaService($db, $validator, $data))->handle($arenaAction, $body, $user);', "$result = \\SparowTypeAudit\\SqlProfile::stage('arena', static fn() => (new ArenaService($db, $validator, $data))->handle($arenaAction, $body, $user));");
    replace('session_write_close();', "\\SparowTypeAudit\\SqlProfile::stage('session_close', static fn() => session_write_close());", 2);
    replace('echo Database::json($result);', "echo \\SparowTypeAudit\\SqlProfile::stage('json_encode', static fn() => Database::json($result));");
  });
  if(file==='backend/src/ArenaEvidence.php') value=transform(file,value,replace=>{
    replace("$finish?$this->validator->validate($candidate,$user['id'],false,false):$this->validator->validateCheckpoint($candidate,$user['id'])", "\\SparowTypeAudit\\SqlProfile::stage('candidate_validate', fn() => $finish?$this->validator->validate($candidate,$user['id'],false,false):$this->validator->validateCheckpoint($candidate,$user['id']))");
    replace("$this->validator->replay($candidate['configuration'],$candidate['events'],$elapsed,['targetText'=>$room['expected_text'],'finiteFinal'=>$finish,'includeTimeSeries'=>$finish])", "\\SparowTypeAudit\\SqlProfile::stage('locked_replay', fn() => $this->validator->replay($candidate['configuration'],$candidate['events'],$elapsed,['targetText'=>$room['expected_text'],'finiteFinal'=>$finish,'includeTimeSeries'=>$finish]))");
  });
  if(file==='backend/src/ArenaService.php') value=transform(file,value,replace=>replace("$this->serialize($room,$user['id'],$action==='spectate',$this->now())", "\\SparowTypeAudit\\SqlProfile::stage('serialize', fn() => $this->serialize($room,$user['id'],$action==='spectate',$this->now()))"));
  await exactFile(file, value);
}
assert.equal(cloneFiles.length,38);
let candidate=await readFile(candidateFile,'utf8');
candidate=transform(candidateFile,candidate,replace=>{
  replace('final class ArenaServiceCachedCandidate', 'final class ArenaServiceProjectionCandidate');
  replace("$this->serialize($room,$user['id'],$action==='spectate',$this->now())", "\\SparowTypeAudit\\SqlProfile::stage('serialize', fn() => $this->serialize($room,$user['id'],$action==='spectate',$this->now()))");
});
await exactFile('backend/src/ArenaServiceProjectionCandidate.php',candidate);
await exactFile('projection-sql-profile-runtime.php',await readFile(`${directory}/projection-sql-profile-runtime.php`));
const originalOwner='audit/2026-11-02/pack-capacity-instance-source34.mjs';
const ownerFile=`${directory}/run-owned-arena-diagnostic.mjs`;
let owner=transform(originalOwner,await readFile(originalOwner,'utf8'),replace=>{
  replace("import readline from 'node:readline';", "import readline from 'node:readline';\nimport { verifyDiagnosticClone } from './arena-diagnostic-guard.mjs';\nimport { writeProjectionHttpWrapper } from './projection-http-wrapper.mjs';");
  replace("assert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1'", "assert.equal(process.env.SPAROWTYPE_ARENA_MEMBER_DIAGNOSTIC, '1', 'Separate diagnostic GO required.');\nconst diagnostic = await verifyDiagnosticClone();\nassert.equal(process.env.SPAROWTYPE_PACK_INSTANCE_ACCEPTANCE, '1'");
  replace('apache = await prepareApache({ owned, root, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });', "apache = await prepareApache({ owned, root: diagnostic.profileRoot, privateLogs, appConfig: configFile, phpDirectory: path.dirname(runtime.binary), port: apiPort });\n    const shim = await writeProjectionHttpWrapper({ webRoot: apache.webRoot, owned, configFile, profileRoot: diagnostic.profileRoot, root, ownerId:id });\n    await receipt('diagnostic-shim',shim);\n    await receipt('diagnostic-clone',diagnostic);");
});
const loopStart=owner.indexOf('    for await (const line of lines) {');
const loopEnd=owner.indexOf('    clearTimeout(lease);',loopStart);
assert.ok(loopStart>0&&loopEnd>loopStart);
const oldLoop=owner.slice(loopStart,loopEnd);
const newLoop=`    let lockProofDone=false,baselineDone=false,candidateDone=false;
    for await (const line of lines) {
      const command=line.trim();
      assert.ok(['cleanup','renew','db-proof','baseline-full','candidate-full'].includes(command),'Only the declared diagnostic commands are allowed.');
      if(command==='cleanup'){lines.close();break;}
      if(command==='renew'){renew();continue;}
      await verifyDiagnosticClone();
      if(command==='db-proof'){
        assert.equal(lockProofDone,false,'No proof retries on this owner.');lockProofDone=true;
        const result=await capture(runtime.binary,[...runtime.args,path.join(root,'${directory}/arena-native-lock-proof.php')],'diagnostic-db-proof',undefined,90000);
        let proof=null;try{proof=JSON.parse(result.stdout);}catch{}
        if(proof)await receipt('diagnostic-db-proof',proof);
        assert.equal(result.code,0,'Native lock proof failed; stop diagnostic.');
        assert.equal(proof?.status,'PASS-SCOPED-NATIVE-LOCKS');
        publicMessage({stage:'diagnostic-db-proof-closed',passed:proof.passed,failed:proof.failed});
        continue;
      }
      assert.equal(lockProofDone,true,'Native physical lock proof must precede HTTP diagnostics.');
      const variant=command==='baseline-full'?'baseline':'candidate';
      if(variant==='baseline'){assert.equal(baselineDone,false);baselineDone=true;}else{assert.equal(baselineDone,true);assert.equal(candidateDone,false);candidateDone=true;}
      environment.SPAROWTYPE_ARENA_DIAGNOSTIC_VARIANT=variant;
      const result=await capture(process.execPath,['--experimental-transform-types',path.join(root,'${directory}/run-arena-diagnostic-burst.mjs')],'diagnostic-'+variant,undefined,240000);
      const report=JSON.parse(await readFile(path.join(receipts,'arena-diagnostic-'+variant+'-'+id+'.json'),'utf8'));
      await receipt('diagnostic-'+variant+'-summary',{variant,childExit:result.code,p95Ms:report.p95Ms,total:report.total,failedChecks:report.checks.filter(row=>!row.pass)});
      assert.equal(report.failure,null);assert.equal(report.watchdogExpired,false);assert.equal(report.total,1653);assert.equal(report.unexpectedRequests.length,0);assert.equal(report.inputsUnchanged,true);
      assert.ok(report.checks.filter(row=>!row.pass).every(row=>row.name==='successful-request p95 remains strictly below150ms'),'A non-latency diagnostic contract failed.');
      await verifyDiagnosticClone();
      publicMessage({stage:'diagnostic-http-closed',variant,total:report.total,p95Ms:report.p95Ms,targetMet:report.targetMet,scope:'Instrumented ordered pair; not ordinary acceptance.'});
    }
`;
owner=owner.slice(0,loopStart)+newLoop+owner.slice(loopEnd);
transforms.push({file:ownerFile,manualLoopReplacement:{before:oldLoop,after:newLoop},scope:'Replace held command dispatcher only; original owned service/provisioning/cleanup body retained.'});
await writeFile(ownerFile,owner,{flag:'wx'});
const originalDriver='audit/2026-11-02/run-source34-capacity-burst.mjs';
const driverFile=`${directory}/run-arena-diagnostic-burst.mjs`;
let driver=transform(originalDriver,await readFile(originalDriver,'utf8'),replace=>{
  replace("import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';", "import { verifyDiagnosticPrimary as verifyFrozenSource, verifyDiagnosticClone } from './arena-diagnostic-guard.mjs';");
  replace("assert.equal(process.env.SPAROWTYPE_SOURCE34_CAPACITY_ACCEPTANCE, '1', 'Root must explicitly enable this owned capacity window.');", "assert.equal(process.env.SPAROWTYPE_ARENA_MEMBER_DIAGNOSTIC, '1', 'Separate diagnostic GO required.');\nawait verifyDiagnosticClone();\nconst variant=process.env.SPAROWTYPE_ARENA_DIAGNOSTIC_VARIANT;assert.ok(['baseline','candidate'].includes(variant));");
  replace("const directory = 'audit/2026-11-02';", `const directory = '${directory}';`);
  replace("const sourceFile = `${directory}/final34-source.json`;", "const sourceFile = `${directory}/owned-arena-diagnostic-preparation.json`;");
  replace('const prefix = `source34-capacity-${ownerId}`;', 'const prefix = `arena-diagnostic-${variant}-${ownerId}`;');
  replace("const inputs = ['audit/2026-11-02/pack-capacity-instance-source34.mjs', 'audit/2026-11-02/run-source34-capacity-burst.mjs', 'backend/tests/arena-audit-admin.php', 'scripts/php-runtime.mjs'];", `const inputs = ['${ownerFile}','${driverFile}','${directory}/arena-diagnostic-guard.mjs','${directory}/owned-arena-diagnostic-preparation.json','backend/tests/arena-audit-admin.php','scripts/php-runtime.mjs'];`);
  replace("  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build:", "  diagnosticOnly:true,ordinaryAcceptanceReplaced:false,candidateKind:'transaction-local-one-room-locked-member-snapshot',variant,orderedPair:'baseline then candidate on same owned DB; no added warmup; later DB state is warmed',frontendBuildClaim:false,\n  declaredAt: new Date().toISOString(), status: 'NOT-RUN', build:");
  replace("headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account.csrf, Cookie: account.cookie },", "headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account.csrf, Cookie: account.cookie, 'X-SparowType-Arena-Projection':variant },");
  replace("row.serverTiming = response.headers.get('server-timing');", "row.serverTiming = response.headers.get('server-timing');\n    row.variantGuard = response.headers.get('x-sparowtype-arena-projection')===variant && response.headers.get('x-sparowtype-arena-projection-guard')==='owned-v1';\n    row.profileProof = /(?:^|,\\s*)profile_marker;dur=35\\.000;/.test(row.serverTiming??'') && new RegExp('(?:^|,\\\\s*)profile_variant;dur='+ (variant==='baseline'?'0':'1') +'\\\\.000;').test(row.serverTiming??'') && /(?:^|,\\s*)profile_owned_guard;dur=1\\.000;/.test(row.serverTiming??'') && /(?:^|,\\s*)profile_overflow;dur=0\\.000;/.test(row.serverTiming??'') && /(?:^|,\\s*)profile_opcode_cache;dur=0\\.000;/.test(row.serverTiming??'');");
  replace("check('exact1653 planned Arena requests completed with no omitted phase',", "check('all1653 owned variant and bounded instrumentation proofs are present',requestRows.length===1653&&requestRows.every(row=>row.variantGuard&&row.profileProof));\n  check('exact1653 planned Arena requests completed with no omitted phase',");
  replace("status: passed ? 'PASS-SCOPED-CAPACITY-BURST' : 'FAILED'", "status: passed ? 'PASS-SCOPED-INSTRUMENTED-ORDERED-DIAGNOSTIC' : 'FAILED'");
});
await writeFile(driverFile,driver,{flag:'wx'});
const runtimeFiles=[ownerFile,driverFile,`${directory}/arena-diagnostic-guard.mjs`,`${directory}/projection-http-wrapper.mjs`,`${directory}/projection-sql-profile-runtime.php`,`${directory}/arena-native-lock-proof.php`,`${directory}/arena-member-cache-contract.php`,`${directory}/arena-member-cache-preparation.json`,`${directory}/arena-member-cache-pure-result.json`,`${directory}/arena-member-cache-pure-protocol.json`,candidateFile,'backend/tests/arena-audit-admin.php','scripts/php-runtime.mjs','audit/2026-10-21/pack-apache-runtime.mjs'];
const runtimeInputs=Object.fromEntries(await Promise.all(runtimeFiles.map(async file=>[file,sha(await readFile(file))])));
const manifest={preparedAt:new Date().toISOString(),status:'FILE-PREPARED-NOT-RUN',kind:'owned-ordered-uncached-PHP-baseline-vs-member-cache-diagnostic',candidateKind:'transaction-local-one-room-locked-member-snapshot',sourceBaseline:'audit/2026-11-02/final34-source.json',baselineFrontendMetadata:frozen.local,preclinicalSource:{count:Object.keys(rawHashes).length,rawHashes,authorizedDifferences,scope:'Only authorized Profile source delta is permitted; no fresh frontend build identity.'},backend38Unchanged:true,producerDependencies,cloneRoot:path.relative(process.cwd(),cloneRoot).replaceAll('\\','/'),cloneFiles,runtimeInputs,transforms,entry:ownerFile,driver:driverFile,expectedProtocol:{order:['db-proof','baseline-full','candidate-full','cleanup'],requestsPerVariant:1653,rooms:50,seatsPerRoom:8,concurrency:20,p95StrictlyBelowMs:150,retries:0,filtering:false,opcodeCache:false,persistentPDO:false,DBDurabilityPolicy:'unchanged',artificialWarmup:false,qualification:'Instrumented baseline first; candidate follows on same DB. Ordered diagnostics cannot establish independent cold or final ordinary acceptance.'},productionEdited:false,servicesStarted:0,runtimeExecuted:false,syntaxStatus:'PENDING-NO-PHP-OR-TEST-RUNTIME-IN-PREP'};
await writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({prepared:true,manifestFile,manifestSha256:sha(await readFile(manifestFile)),cloneFiles:cloneFiles.length,producerDependencies:Object.keys(producerDependencies).length,authorizedDifferences,syntax:'PENDING'}));
