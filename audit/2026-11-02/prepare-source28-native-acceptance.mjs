// PREPARATION ONLY: clones guarded audit helpers, never imports their execution.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';

const directory = 'audit/2026-11-02';
const hash = value => createHash('sha256').update(value).digest('hex');
const oldOwner = 'audit/2026-10-27/pack-backend-instance-source27.mjs';
const newOwner = `${directory}/pack-backend-instance-source28.mjs`;
const oldAdapter = 'audit/2026-10-27/pack-native-browser-final27-routed-fault-confirmation.mjs';
const newAdapter = `${directory}/pack-native-browser-final28.mjs`;
await Promise.all([newOwner, newAdapter].map(file => assert.rejects(access(file), { code: 'ENOENT' })));

const ownerRaw = await readFile(oldOwner);
const ownerBaseline = ownerRaw.toString('utf8').replaceAll('\r\n', '\n');
const owner = ownerBaseline.replaceAll('SPAROWTYPE_FINAL27_', 'SPAROWTYPE_FINAL28_')
  .replaceAll('source27', 'source28')
  .replace("audit/2026-10-27/final27-source.json", "audit/2026-11-02/final28-source.json");
assert.equal(owner.replaceAll('SPAROWTYPE_FINAL28_', 'SPAROWTYPE_FINAL27_')
  .replaceAll('source28', 'source27')
  .replace('audit/2026-11-02/final28-source.json', 'audit/2026-10-27/final27-source.json'), ownerBaseline);
assert.equal(owner.includes("selected.length===1&&selected[0]==='password'"), true);
assert.equal(owner.includes("if(command==='prepare-browser')await prepareBrowser()"), true);
assert.equal(owner.includes("if(command==='cleanup'){lines.close();break;}"), true);
await writeFile(newOwner, owner, { flag: 'wx' });

const adapterRaw = await readFile(oldAdapter);
const adapterBaseline = adapterRaw.toString('utf8').replaceAll('\r\n', '\n');
let adapter = adapterBaseline;
const replacements = [];
const replaceOnce = (before, after) => {
  assert.equal(adapter.split(before).length - 1, 1, `Missing or ambiguous adapter anchor: ${before.slice(0, 80)}`);
  adapter = adapter.replace(before, after); replacements.push({ before, after });
};
replaceOnce("assert.equal(process.env.SPAROWTYPE_FINAL27_NATIVE_ROUTED_FAULT_CONFIRMATION_WINDOW,'1','Wait for the separately coordinated source27 four-engine route-isolated fault confirmation.');",
  "assert.equal(process.env.SPAROWTYPE_FINAL28_NATIVE_BROWSER_WINDOW,'1','Wait for the separately coordinated source28 native acceptance window.');\nconst engine=process.env.SPAROWTYPE_FINAL28_NATIVE_ENGINE;\nassert.ok(['chromium','edge','firefox','webkit'].includes(engine),'Select exactly one native engine; the outer owner runner sequences all four.');\nassert.match(process.env.SPAROWTYPE_FINAL28_NATIVE_OWNER??'',/^[a-f0-9]{16}$/,'Bind the newly created public owner ID.');");
replaceOnce("const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));assert.equal(path.basename(owned),`pack-instance-${marker.id}`);assert.equal(path.resolve(marker.root).toLowerCase(),root.toLowerCase());",
  "const marker=JSON.parse(await readFile(path.join(owned,'ownership.json'),'utf8'));assert.equal(path.basename(owned),`pack-instance-${marker.id}`);assert.equal(path.resolve(marker.root).toLowerCase(),root.toLowerCase());\nassert.equal(marker.id,process.env.SPAROWTYPE_FINAL28_NATIVE_OWNER,'The adapter must consume exactly the fresh owner bound by the orchestrator.');\nassert.equal(path.basename(readyPath),`pack-backend-${marker.id}-browser-ready.json`);");
replaceOnce('const attempt=`${marker.id}-${Date.now()}`,prefix=path.join(here,`pack-native-final27-routed-fault-confirmation-${attempt}`);',
  'const attempt=`${marker.id}-${Date.now()}`,prefix=path.join(here,`pack-native-final28-${engine}-${attempt}`);');
replaceOnce("assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC,'This confirmation runs exactly the corrected real-backend fault case for all four engines.');",
  "assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC,'This acceptance runs all five original native titles for exactly one engine; no diagnostic subset.');");
replaceOnce("scope:'Fresh-owner exact routed-fault case in four engines; serviceWorkers:block is local to appended fault test and peer context. Existing assertions/timeouts unchanged; new controller-null and route-hit controls. All original failures retained; SW response causality unproven.'",
  "scope:'All five original native titles in one engine against its own fresh owned Apache/PHP/MariaDB instance and dedicated accounts. No counter resets, reseeding or rate-limit policy changes. Route-controlled fault case alone blocks service workers; normal human-race and PWA behavior remain unchanged. Original source27 failures retained.'");
replaceOnce("engines:['chromium','edge','firefox','webkit'],expectedCases:4", "engines:[engine],expectedCases:5");
replaceOnce("const selected=['real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish'];",
  "const selected=['real PHP account signup, replay upload, independent-device history/preferences and account deletion','real two-browser PHP human race shares opponent pace and settles server results','real account sign in with dedicated deployment credentials','PHP two-account race authorization and server-owned countdown','real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish'];");
replaceOnce("'--workers=1','--retries=0','--trace=off','--reporter=json'", "`--project=${engine}`,'--workers=1','--retries=0','--trace=off','--reporter=json'");
replaceOnce('`.playwright-artifacts-pack-native-final27-routed-fault-confirmation-${attempt}`', '`.playwright-artifacts-pack-native-final28-${engine}-${attempt}`');
replaceOnce("const cases=[];const collect=suite=>{for(const spec of suite.specs??[])for(const item of spec.tests??[])cases.push({title:spec.title,engine:item.projectName});for(const childSuite of suite.suites??[])collect(childSuite);};for(const suite of report?.suites??[])collect(suite);const expectedCases=protocol.engines.map(engine=>`${engine}:${selected[0]}`).sort();const exactCasesVerified=cases.length===4&&JSON.stringify(cases.map(item=>`${item.engine}:${item.title}`).sort())===JSON.stringify(expectedCases);",
  "const cases=[];const collect=suite=>{for(const spec of suite.specs??[])for(const item of spec.tests??[])cases.push({title:spec.title,engine:item.projectName,status:item.status,results:(item.results??[]).map(result=>({status:result.status,retry:result.retry,durationMs:result.duration}))});for(const childSuite of suite.suites??[])collect(childSuite);};for(const suite of report?.suites??[])collect(suite);const expectedCases=selected.map(title=>`${engine}:${title}`).sort();const exactCasesVerified=cases.length===5&&JSON.stringify(cases.map(item=>`${item.engine}:${item.title}`).sort())===JSON.stringify(expectedCases);\n const exactResultsVerified=cases.every(item=>item.status==='expected'&&item.results.length===1&&item.results[0].status==='passed'&&item.results[0].retry===0)&&Array.isArray(report?.errors)&&report.errors.length===0&&report?.config?.workers===1&&report?.config?.projects?.length===1&&report.config.projects[0].name===engine&&report.config.projects[0].retries===0;");
replaceOnce("summary={exactCasesVerified,actualCases:cases,status:exitCode===0&&exactCasesVerified&&stats?.expected===protocol.expectedCases&&stats?.unexpected===0&&stats?.skipped===0?'PASS':'FAILED'",
  "summary={exactCasesVerified,exactResultsVerified,actualCases:cases,status:exitCode===0&&exactCasesVerified&&exactResultsVerified&&stats?.expected===protocol.expectedCases&&stats?.unexpected===0&&stats?.skipped===0&&stats?.flaky===0?'PASS':'FAILED'");
let reversed = adapter;
for (const { before, after } of [...replacements].reverse()) {
  assert.equal(reversed.split(after).length - 1, 1); reversed = reversed.replace(after, before);
}
assert.equal(reversed, adapterBaseline);
await writeFile(newAdapter, adapter, { flag: 'wx' });

await writeFile(`${directory}/source28-native-acceptance-preparation.json`, JSON.stringify({
  capturedAt: new Date().toISOString(), status: 'PREPARED-NOT-RUN',
  owner: { baseline: oldOwner, baselineRawSha256: hash(ownerRaw), target: newOwner, sha256: hash(owner), normalizedCloneReversesExactly: true, changes: ['New source28 build/window names', 'New audit/2026-11-02/final28-source.json frozen source path'], provisioningCleanupRatePolicyChanged: false },
  adapter: { baseline: oldAdapter, baselineRawSha256: hash(adapterRaw), target: newAdapter, sha256: hash(adapter), exactReversalVerified: true, changes: replacements },
  execution: { orchestrator: `${directory}/run-final28-native-browser.mjs`, engines: ['chromium', 'edge', 'firefox', 'webkit'], sequential: true, freshBackendPerEngine: true, expectedCasesPerEngine: 5, expectedTotalCases: 20, workers: 1, retries: 0, traces: false, sourceFile: `${directory}/final28-source.json`, buildEnv: 'SPAROWTYPE_FINAL28_BUILD_ID', actualBuildKnown: false, defaultDist: 'dist', sourceFileCountRequired: 505 },
  comparisonBoundary: 'A new acceptance run across four independent fresh instances, not a rewrite or aggregation of source27 failures, not concurrent or400-user capacity evidence.',
  privateOriginalConfigsRead: false, originalServicesOrDatabaseTouched: false, servicesStarted: 0, testsRun: 0,
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', newOwner, newAdapter, servicesStarted: 0, testsRun: 0 }));
