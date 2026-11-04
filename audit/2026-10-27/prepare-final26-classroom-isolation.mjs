// Preparation only; no native test, process, database or HTTP request starts.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory='audit/2026-10-27',source=`${directory}/run-final26-native-ci.mjs`,target=`${directory}/run-final26-classroom-isolation-confirmation.mjs`;
await assert.rejects(access(target),{code:'ENOENT'});const original=await readFile(source,'utf8');let text=original;
const pairs=[
 ['SPAROWTYPE_FINAL26_NATIVE_CI','SPAROWTYPE_FINAL26_CLASSROOM_ISOLATION_CONFIRMATION'],
 ['final26-native-ci.json','final26-classroom-isolation-confirmation.json'],
 ['final26-native-ci.log','final26-classroom-isolation-confirmation.log'],
 ["const suites = ['data', 'race', 'course', 'progression', 'social', 'classroom', 'arena-http', 'password'];","const suites = ['classroom'];"],
 ["scope: 'Current frozen source26 real loopback Apache/PHP/PDO/MariaDB module contracts on one wholly new synthetic database. No browser, capacity load, hosted or physical-device claim.'", "scope: 'Current frozen source26 isolated classroom9-check real Apache/PHP/PDO lifecycle on one wholly new synthetic database. Original8-suite quota failure retained; no browser, capacity, hosted or physical-device claim.'"],
 ["coverageExtension: { preservedFiveSuiteWrapper: 'audit/2026-10-27/run-final26-native-modules.mjs', addedCiLifecycleSuites: ['data', 'race', 'course'], requiredExactSuiteCount: 8, allOriginalFiveIncludedExactlyOnce: true, ciWorkflow: '.github/workflows/ci.yml', testAssertionsOrOwnerCleanupChanged: false }", "isolationConfirmation: { originalFailedReceipt: 'audit/2026-10-27/final26-native-ci.json', originalOwner: '5aca146872db63d8', originalFailure: 'Classroom signup HTTP429 after earlier suites consumed the unchanged protected30/min authentication budget.', requiredExactSuiteCount: 1, requiredExactClassroomChecks: 9, freshOwnerRequired: true, originalEightSuiteResultReplaced: false, rateCountersReset: false, productionLimitsChanged: false, testAssertionsOrOwnerCleanupChanged: false }"],
 ["Fresh source26 native CI lifecycle acceptance: data, race, course, progression, social, classroom, Arena HTTP and password exactly once; no browser or capacity workload.","Separately authorized classroom-only9-check confirmation in a fresh source26 owner after retained8-suite HTTP429 fixture-quota exhaustion. No counter reset, production limiter change or other suite/browser/capacity workload."],
 ["const cleanup = report.events.find(event => event.stage === 'ephemeral-cleanup');", `const cleanup = report.events.find(event => event.stage === 'ephemeral-cleanup');
  const provision = report.events.find(event => event.stage === 'ephemeral-provision');
  const ownerMatch = /^sparow_pack_([a-f0-9]{16})_audit$/.exec(provision?.database ?? '');
  assert.ok(ownerMatch, 'Fresh owned database identity missing.');
  assert.notEqual(ownerMatch[1], '5aca146872db63d8', 'Do not reuse the failed8-suite owner.');
  report.classroomReceipt = 'pack-backend-' + ownerMatch[1] + '-classroom.json';
  report.classroomResult = JSON.parse(await readFile(directory + '/' + report.classroomReceipt, 'utf8'));
  assert.equal(report.classroomResult.guardedTarget.database, provision.database);`],
 ['results.length === 8','results.length === 1'],
 ["&& cleanup?.ownProcessesStopped === true", "&& report.classroomResult?.status === 'PASS' && report.classroomResult.passed === 9 && report.classroomResult.failed === 0 && report.classroomResult.checks.length === 9 && report.classroomResult.checks.every(check => check.status === 'PASS') && report.classroomResult.rateCountersReset === false && report.classroomResult.userDatabaseTouched === false && report.classroomResult.credentialsOrCookiesEmitted === false && cleanup?.ownProcessesStopped === true"],
];
const substitutions=[];
for(const [before,after]of pairs){const count=text.split(before).length-1;assert.ok(count>0,'Missing exact wrapper adapter anchor.');text=text.split(before).join(after);substitutions.push({before,after,count});}
let reverse=text;for(const [before,after]of [...pairs].reverse())reverse=reverse.split(after).join(before);assert.equal(reverse,original);
await writeFile(target,text,{flag:'wx'});
const sha=value=>createHash('sha256').update(value).digest('hex');
await writeFile(`${directory}/final26-classroom-isolation-preparation.json`,JSON.stringify({preparedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',source,sourceSha256:sha(original),target,targetSha256:sha(text),reversibleByteIdentity:true,substitutions,requiredBuild:'88b8024ae4b840c10422',requiredSourceFiles:505,requiredSuite:'classroom',requiredChecks:9,originalEightSuiteFailureRetained:'final26-native-ci.json',runRequires:'Separate root GO, SPAROWTYPE_FINAL26_CLASSROOM_ISOLATION_CONFIRMATION=1 and SPAROWTYPE_FINAL26_BUILD_ID actual build.',servicesStarted:0,testsRun:0,privateConfigurationRead:false,productFilesChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED-NOT-RUN',target,servicesStarted:0}));
