// Preparation only: write fresh audit wrappers; never start acceptance jobs.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash } from '../2026-10-21/artifact-verification.mjs';
const directory = 'audit/2026-10-27';
const newNativeTitle = 'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish';
const frontendFiles = ['src/pages/Race.tsx', 'src/lib/race-state-machine.ts', 'src/lib/__tests__/race-state-machine.test.ts', 'src/components/typing/LiveKeyboard.tsx', 'src/lib/__tests__/pressed-key-attribute.test.ts', 'src/lib/pressed-key-attribute.ts'];
const definitions = [
  ['run-browser-checkpoint-final26.mjs', 'run-browser-checkpoint-final27.mjs'],
  ['run-final26-browser-matrix.mjs', 'run-final27-browser-matrix.mjs'],
  ['run-final26-static.mjs', 'run-final27-static.mjs'],
  ['run-final26-native-browser.mjs', 'run-final27-native-browser.mjs'],
  ['measure-mobile-workspaces-static-final26.mjs', 'measure-mobile-workspaces-static-final27.mjs'],
  ['run-mobile-workspaces-static-final26.mjs', 'run-mobile-workspaces-static-final27.mjs'],
  ['pack-native-browser.mjs', 'pack-native-browser-final27.mjs'],
];
const output = directory + '/source27-frontend-wrapper-preparation.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const prepared = [], pending = [];
for (const [oldName, newName] of definitions) {
  const oldFile = directory + '/' + oldName, file = directory + '/' + newName;
  await assert.rejects(access(file), { code: 'ENOENT' });
  const original = await readFile(oldFile, 'utf8');
  let text = original;
  const substitutions = [];
  const adapt = (before, after, expected) => {
    const count = text.split(before).length - 1;
    if (expected !== undefined) assert.equal(count, expected, oldName + ': ' + before);
    if (!count) return;
    text = text.replaceAll(before, after); substitutions.push({ before, after, count });
  };
  for (const [before, after] of [['final26','final27'],['FINAL26','FINAL27'],['source26','source27'],['SOURCE26','SOURCE27'],['Source26','Source27']]) adapt(before,after);
  adapt('/pack-native-browser.mjs','/pack-native-browser-final27.mjs');
  if (oldName === 'run-final26-browser-matrix.mjs') {
    adapt("proposedChangedBackendFiles: ['backend/public/index.php', 'backend/src/RequestBody.php']", 'proposedChangedBackendFiles: []', 1);
    adapt("changedExistingFrontendFiles: ['src/domain/arena.ts', 'src/services/arena-service.ts', 'src/domain/__tests__/arena.test.ts']", 'changedExistingFrontendFiles: ' + JSON.stringify(frontendFiles), 1);
    adapt('separately guarded16-case backend run','separately guarded20-case backend run',1);
  }
  if (oldName === 'run-final26-native-browser.mjs') {
    adapt('all16 native cases','all20 native cases',1);
    adapt('Exact existing16 account and human-race browser cases against','Original16 native cases plus one new real human-race regression per engine (20 total) against',1);
    adapt('expectedCases: 16','expectedCases: 20',2);
    adapt('stats?.expected === 16','stats?.expected === 20',1);
    adapt('caseSelectionAndAssertionsChanged: false','caseSelectionAndAssertionsChanged: true, existingCaseAssertionsChanged: false, addedCasesPerEngine: 1',1);
  }
  if (oldName === 'pack-native-browser.mjs') {
    adapt('pack-native-'+'$'+'{attempt}','pack-native-final27-'+'$'+'{attempt}',2);
    adapt('expectedCases:diagnostic?1:16','expectedCases:diagnostic?1:20',1);
    adapt("'PHP two-account race authorization and server-owned countdown'];","'PHP two-account race authorization and server-owned countdown','"+newNativeTitle+"'];",1);
  }
  assert.ok(!text.includes('88b8024ae4b840c10422'),'No former build may be hardcoded.');
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed=reversed.replaceAll(change.after,change.before);
  assert.equal(reversed,original,'Every new wrapper must reverse exactly to its preserved input.');
  pending.push({file,text});
  prepared.push({oldFile,originalSha256:hash(original),file,sha256:hash(text),substitutions,reversibleByteIdentity:true});
}
for (const item of prepared) assert.equal(hash(await readFile(item.oldFile)),item.originalSha256);
for (const item of pending) await writeFile(item.file,item.text,{flag:'wx'});
const report = {
  status:'PREPARED-NOT-RUN-SOURCE27-FREEZE-AND-BUILD-PENDING',preparedAt:new Date().toISOString(),
  requiredSource:directory+'/final27-source.json',requiredBuildEnvironment:'SPAROWTYPE_FINAL27_BUILD_ID',requiredFrozenFiles:505,
  expectedBuild:'ACTUAL-RUNTIME-ONLY-NO-HARDCODED-BUILD',frontendFiles,changedExistingE2E:'e2e/php-human-race.spec.ts',
  testInventory:{specFiles:64,engines:['chromium','edge','firefox','webkit'],nativeCases:20,originalNativeCases:16,newNativeCases:4,newNativeTitle,workers:1,retries:0,existingAssertionsAndDeadlinesUnchanged:true,actualCollectedCaseTotalRequired:true},
  owner:{file:directory+'/pack-backend-instance-source27.mjs',preparedSeparatelyBy:'release_review',scope:'Fresh synthetic owner for password preparation, browser-ready/renew and cleanup only; never capacity/native-rate/nativeCI8.'},
  freshMeasurementsRequired:{frontendBuildAndFreeze:true,input:'Three unfiltered original495-character4xCPU runs with directory-only adapter and actual27 build guard.',lighthouse:'Three fresh normal full3D mobile runs with no quality/skip/reduced-motion override.',bundle:'Fresh27 budget and exact preserved brand-asset checks.',static:'Fresh unique27 Vercel root and Pages subpath outputs across all4 engines.',mobileWorkspaces:'Original4-case measurement against new27 static root artifact.'},
  strictReuseScope:{backendAndWireMustMatch26:true,filesComparedBeforeReuse:'Every frozen backend source plus src/domain/arena.ts and src/services/arena-service.ts.',allowedProductDelta:frontendFiles,currentFrontendEvidenceReuse:'NOT-USED',priorFailedCapacityRetained:true,source26BackendAndWireAcceptanceOnly:'May be cited only after exact hash/delta verification; never relabeled as a fresh27 workload.',freshNative20Required:true,capacityOrNativeCi8WrappersPrepared:false,portableDeno:'26 download failure remains UNVERIFIED; no retry/setup wrapper copied.'},
  guarantees:['All source26 wrappers/receipts unchanged.','Only audit identifiers, runtime build bindings, declared frontend delta and the appended native selection differ.','No existing assertion, timeout, worker, retry, rate, durability or performance threshold relaxed.','No production/E2E edit, build, test, service, browser, database or download started.'],
  prepared,acceptanceJobsRun:0,servicesStarted:0,browsersStarted:0,downloadsRun:0,
};
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,output,preparedFiles:prepared.length,sourceFiles:505,specs:64,nativeCases:20}));
