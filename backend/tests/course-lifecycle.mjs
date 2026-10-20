import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Deliberate native acceptance only; never run against the normal local account
// database. No reset of rate counters, foreign accounts, or production settings.
assert.equal(process.env.SPAROWTYPE_COURSE_HTTP_ACCEPTANCE, '1', 'Explicitly enable SPAROWTYPE_COURSE_HTTP_ACCEPTANCE=1 after switching the API to its dedicated audit configuration.');
assert.ok(process.env.SPAROWTYPE_CONFIG_FILE, 'An explicit private test configuration is required.');
const root = path.resolve(import.meta.dirname, '../..');
const here = path.join(root, 'audit/learning-upgrade-2026-10-20');
const base = new URL(process.env.SPAROWTYPE_TEST_API_URL || 'http://127.0.0.1:8081/api');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname), 'Only an explicitly configured loopback test API is allowed.');
const runtime = phpRuntime();
const run = randomBytes(5).toString('hex');
const email = `http-audit-${run}-alice@example.invalid`;
const password = `CourseAcceptance!${randomUUID()}`;
const checks = [];
const temporary = await mkdtemp(path.join(os.tmpdir(), 'sparowtype-course-http-'));
let owner = null, created = false, failure = null, guardedTarget = null;
function fixture(operation, extra = {}) {
  const result = spawnSync(runtime.binary, [...runtime.args, path.join(root, 'backend/tests/course-fixture.php')], {
    cwd: root, env: process.env, input: JSON.stringify({ run, operation, ...extra }), encoding: 'utf8', windowsHide: true,
  });
  assert.equal(result.status, 0, `Guarded fixture ${operation} failed; private diagnostics were suppressed.`);
  return JSON.parse(result.stdout);
}
class Client {
  cookies = new Map(); csrf = ''; user = null;
  async call(method, route, body, expected = 200) {
    const response = await fetch(`${base.href.replace(/\/$/, '')}${route}`, {
      method, signal: AbortSignal.timeout(15_000), headers: { Accept: 'application/json', Cookie: [...this.cookies].map(([key,value]) => `${key}=${value}`).join('; '),
        ...(method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    for (const value of response.headers.getSetCookie()) { const pair = value.split(';',1)[0], index = pair.indexOf('='); this.cookies.set(pair.slice(0,index),pair.slice(index+1)); }
    const value = await response.json();
    if (value.csrfToken) this.csrf = value.csrfToken;
    if (Object.hasOwn(value,'user')) this.user = value.user;
    assert.equal(response.status, expected, `${method} ${route.split('?')[0]} returned HTTP${response.status} (${value.error?.code || 'unexpected response'}).`);
    return { response, value };
  }
}
const primary = new Client(), independent = new Client();
function canonicalEqual(expected, actual, label) {
  if (typeof expected === 'number' && typeof actual === 'number') { assert.ok(Math.abs(expected-actual)<=Math.max(1e-9,Math.abs(expected)*1e-12),label);return; }
  if (expected && typeof expected === 'object') { assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),`${label} keys`);for(const key of Object.keys(expected))canonicalEqual(expected[key],actual[key],`${label}.${key}`); }
  else assert.equal(actual,expected,label);
}
try {
  const guard = fixture('guard');
  const bootstrap = await primary.call('GET','/auth/session');
  assert.equal(bootstrap.value.user, null);
  assert.ok(bootstrap.response.headers.getSetCookie().some(value => value.startsWith(`${guard.sessionName}=`)), 'The API session namespace differs from the guarded test config.');
  guardedTarget = { database: guard.database, port: guard.port, api: base.href, sessionNamespaceMatched: true };
  await primary.call('POST','/auth/signup',{email,password},201); owner = primary.user.id; created = true;
  checks.push('real cookie account created only after dedicated test database/session guards');
  const catalog = JSON.parse(await readFile(path.join(root,'backend/resources/typing-course-v1.json'),'utf8'));
  for (const name of ['types','transcript','metrics','session']) {
    const source = (await readFile(path.join(root,`src/lib/typing-core/${name}.ts`),'utf8')).replace(/from ['"]\.\/(types|transcript|metrics|session)\.ts['"]/g,(_,target)=>`from './${target}.mjs'`);
    await writeFile(path.join(temporary,`${name}.mjs`),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  }
  const source = (await readFile(path.join(root,'src/lib/typing-course.ts'),'utf8')).replace(/import catalog from ['"][^'"]+\.json['"];?/,`const catalog = ${JSON.stringify(catalog)};`).replace(/from ['"]\.\/typing-core\/(types|transcript|metrics|session)['"]/g,(_,target)=>`from './${target}.mjs'`);
  await writeFile(path.join(temporary,'typing-course.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {SessionController} = await import(pathToFileURL(path.join(temporary,'session.mjs')));
  const {buildCourseConfiguration,assessCourseResult} = await import(pathToFileURL(path.join(temporary,'typing-course.mjs')));
  function candidate(lesson, variantId='a', mistakes=0) {
    let now=0; const config=buildCourseConfiguration(lesson.id,{ownerId:owner,clientSessionId:randomUUID(),variantId});
    const controller=new SessionController(config,{now:()=>now,wallNow:()=>1_792_510_000_000+now});
    const input=text=>{now+=150;controller.input({type:'insert',text});};
    for(let index=0;index<mistakes;index++){input(config.initialTarget[0]==='x'?'z':'x');now+=100;controller.input({type:'delete',text:'',start:0,end:1});}
    const count=lesson.durationMs===null?config.initialTarget.length:80;
    for(const text of config.initialTarget.slice(0,count))input(text);
    if(lesson.durationMs!==null){now=150+lesson.durationMs;controller.tick();}
    return structuredClone(controller.result);
  }
  let pref=(await primary.call('GET','/preferences')).value;
  pref=(await primary.call('POST','/preferences',{expectedOwner:owner,expectedVersion:pref.version,patch:{showKeyboard:false,showFingerGuide:true}})).value;
  assert.equal(pref.preferences.showKeyboard,false);assert.equal(pref.preferences.showFingerGuide,true);
  await primary.call('POST','/preferences',{expectedOwner:owner,expectedVersion:pref.version,patch:{showKeyboard:'true'}},422);
  await primary.call('POST','/preferences',{expectedOwner:owner,expectedVersion:pref.version,patch:{showFingerGuide:1}},422);
  checks.push('keyboard/finger-guide booleans roundtrip and reject nonboolean values');
  const foundation=catalog.lessons.find(lesson=>lesson.durationMs===null), speed=catalog.lessons.find(lesson=>lesson.durationMs!==null);
  const successful=candidate(foundation);
  const accepted=(await primary.call('POST','/sessions',{candidate:successful,cloudConsent:false})).value.accepted;
  canonicalEqual(assessCourseResult(successful),accepted.course,'server course projection');assert.equal(accepted.course.qualifies,true);
  assert.equal(accepted.learningEvidence.assessment,false);assert.equal(accepted.eligibility.eligible,false);
  const retry=(await primary.call('POST','/sessions',{candidate:successful,cloudConsent:false})).value.accepted;
  assert.equal(retry.payloadHash,accepted.payloadHash);assert.deepEqual(retry.course,accepted.course);
  checks.push('server-derived finite course qualification persists with immutable retry and no adaptive/ranked unlock');
  const unsuccessful=candidate(foundation,'b',10);
  const failed=(await primary.call('POST','/sessions',{candidate:unsuccessful,cloudConsent:false})).value.accepted;
  assert.equal(failed.course.qualifies,false);assert.ok(failed.course.reasonCodes.includes('accuracy'));
  assert.ok(failed.metrics.inputAccuracy<100);assert.equal(failed.metrics.finalTextAccuracy,100);
  checks.push('legitimate corrected failed practice is retained without a fabricated qualification');
  const corrupted=structuredClone(successful);corrupted.configuration.settings.course.qualifies=true;
  await primary.call('POST','/sessions',{candidate:corrupted,cloudConsent:false},422);
  const other='22222222-2222-4222-8222-222222222222';
  await primary.call('GET',`/sessions?expectedOwner=${other}`,undefined,409);
  checks.push('client qualification claims and foreign-owner history hints are rejected');
  const timed=candidate(speed);
  const timedAccepted=(await primary.call('POST','/sessions',{candidate:timed,cloudConsent:false})).value.accepted;
  assert.equal(timedAccepted.course.qualifies,true);assert.equal(timedAccepted.course.metrics.elapsedMs,30000);
  const ranking=(await primary.call('GET',`/leaderboards?comparisonKey=${encodeURIComponent(timed.comparisonKey)}&period=alltime`)).value;
  assert.deepEqual(ranking.entries,[]);
  checks.push('30-second speed qualification persists through personal sessions without public ranking');
  await independent.call('GET','/auth/session');await independent.call('POST','/auth/signin',{email,password});
  const history=(await independent.call('GET',`/sessions?expectedOwner=${owner}`)).value;
  assert.equal(history.sessions.length,3);assert.deepEqual(history.sessions.find(row=>row.clientSessionId===successful.clientSessionId).accepted.course,accepted.course);
  const independentPrefs=(await independent.call('GET',`/preferences?expectedOwner=${owner}`)).value;
  assert.equal(independentPrefs.preferences.showKeyboard,false);assert.equal(independentPrefs.preferences.showFingerGuide,true);
  checks.push('independent cookie client restores course projections and keyboard preferences');
  fixture('expire-own-evidence',{owner,sessionId:successful.clientSessionId});
  const afterExpiry=(await independent.call('GET',`/sessions?expectedOwner=${owner}`)).value;
  assert.deepEqual(afterExpiry.sessions.find(row=>row.clientSessionId===successful.clientSessionId).accepted.course,accepted.course);
  assert.deepEqual(fixture('inspect-own-evidence',{owner,sessionId:successful.clientSessionId}),{summaryPresent:true,rawEvidencePresent:false,courseProjectionPresent:true,qualifies:true});
  checks.push('normal replay expiry removes raw evidence while preserving durable course assessment');
  await independent.call('DELETE',`/sessions/${successful.clientSessionId}`,{expectedOwner:owner});
  const afterDeletion=(await independent.call('GET',`/sessions?expectedOwner=${owner}`)).value;
  assert.ok(afterDeletion.sessions.every(row=>row.clientSessionId!==successful.clientSessionId));
  await primary.call('POST','/sessions',{candidate:successful,cloudConsent:false},409);
  checks.push('session deletion removes course contribution and tombstone prevents resurrection');
  await independent.call('POST','/account/delete',{expectedOwner:owner,confirmation:'DELETE MY ACCOUNT'});created=false;
  assert.equal((await primary.call('GET','/auth/session')).value.user,null);
  checks.push('explicit account deletion invalidates the independent original cookie');
} catch(error){failure={message:error instanceof Error?error.message:String(error)};process.exitCode=1;}
finally{
  const cleanup=fixture('cleanup-run');
  await rm(temporary,{recursive:true,force:true});
  const report={date:new Date().toISOString(),scope:'Opt-in native PHP/PDO HTTP course lifecycle using one reserved synthetic account',guardedTarget,checks:checks.map(name=>({name,status:'PASS'})),passed:checks.length,failed:failure?1:0,failure,cleanup,
    createdAccountWasStillPendingBeforeCleanup:created,credentialsOrIdentifiersEmitted:false,rateCountersReset:false,productionDatabaseTouched:false};
  const output=process.env.SPAROWTYPE_COURSE_HTTP_REPORT||path.join(here,'php-course-lifecycle.json');await mkdir(path.dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
