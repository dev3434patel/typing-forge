// Read-only Nov3 identity proof. No service, benchmark, configuration or Git mutation.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, normalizedSourceHash, verifyFrozenSource, sceneAssets, qualityBaseline, compareQuality } from '../2026-10-21/artifact-verification.mjs';
const directory='audit/2026-11-02';
const output=`${directory}/source32-identity-quality-scope.json`;
await assert.rejects(access(output),{code:'ENOENT'});
const source31File=`${directory}/final31-source.json`,source32File=`${directory}/final32-source.json`;
const [oldBytes,newBytes]=await Promise.all([readFile(source31File),readFile(source32File)]);
const previous=JSON.parse(oldBytes),current=JSON.parse(newBytes);
assert.equal(previous.local.version,'f52d0372fe7656817259');assert.equal(current.local.version,'332e23584f1e36465df2');
const verified=await verifyFrozenSource(source32File);
assert.equal(verified.receipt.compared,505);assert.deepEqual(verified.receipt.mismatches,[]);
assert.deepEqual(Object.keys(current.sourceHashes).sort(),Object.keys(previous.sourceHashes).sort());
const production=Object.keys(current.sourceHashes).sort().map(file=>({file,source31Sha256:previous.sourceHashes[file],source32Sha256:current.sourceHashes[file],unchanged:previous.sourceHashes[file]===current.sourceHashes[file]}));
assert.deepEqual(production.filter(row=>!row.unchanged).map(row=>row.file),['src/components/keybr/KeybrLessonMode.tsx']);
const backend=production.filter(row=>row.file.startsWith('backend/'));assert.equal(backend.length,38);assert.ok(backend.every(row=>row.unchanged));
const wire=['src/domain/arena.ts','src/services/arena-service.ts'].map(file=>production.find(row=>row.file===file));
assert.equal(wire.length,2);assert.ok(wire.every(row=>row?.unchanged));
const baseline='275c8c24d65054abae18713c1eee4dad18888332';
assert.equal(current.baseline,baseline);assert.equal(current.fullIntroSourceUnchanged,true);
const brand=[];
for(const row of production.filter(row=>row.file.startsWith('src/components/brand/'))){
  const result=spawnSync('git',['show',`${baseline}:${row.file}`],{windowsHide:true,maxBuffer:2000000});
  assert.equal(result.status,0,'Read-only baseline brand source must resolve.');
  const actual=await readFile(row.file),baselineHash=normalizedSourceHash(row.file,result.stdout);
  assert.equal(baselineHash,row.source32Sha256);assert.equal(normalizedSourceHash(row.file,actual),baselineHash);
  const rawIdentical=result.stdout.equals(actual);
  const normalizedIdentical=result.stdout.toString('utf8').replaceAll('\r\n','\n')===actual.toString('utf8').replaceAll('\r\n','\n');
  assert.equal(normalizedIdentical,true);
  brand.push({...row,baseline,baselineNormalizedSha256:baselineHash,baselineRawSha256:hash(result.stdout),currentRawSha256:hash(actual),rawByteIdenticalToBaseline:rawIdentical,
    normalizedTextIdenticalToBaseline:normalizedIdentical,rawDifferenceOnlyCrLf:!rawIdentical&&normalizedIdentical,
    ...(rawIdentical?{}:{baselineCrLfTerminators:result.stdout.toString('utf8').split('\r\n').length-1,currentCrLfTerminators:actual.toString('utf8').split('\r\n').length-1})});
}
assert.equal(brand.length,21);assert.ok(brand.every(row=>row.normalizedTextIdenticalToBaseline));
const defaultBuild=JSON.parse(await readFile('dist/offline-build.json','utf8'));
assert.deepEqual(defaultBuild,current.local);
const assets=await sceneAssets('dist');
const quality=compareQuality(assets,await qualityBaseline('audit/mobile-games-static-2026-10-20/static-after5-artifacts.json','audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json'));
assert.equal(quality.length,5);assert.ok(quality.every(row=>row.pass));
const capacityFile=`${directory}/source31-capacity-and-cpu-assessment.json`,capacityBytes=await readFile(capacityFile),capacity=JSON.parse(capacityBytes);
assert.equal(capacity.status,'FAILED-CAPACITY-LATENCY');assert.equal(capacity.full.status,'FAILED');assert.equal(capacity.wire.status,'FAILED');
const report={status:'PASS-SCOPED-SOURCE-AND-SCENE-IDENTITY-NOT-CAPACITY-ACCEPTANCE',recordedAt:new Date().toISOString(),
  checkpointDirectoryQualification:'Nov3 UTC execution retained in the continuing audit/2026-11-02 checkpoint directory. Directory name is not an execution date.',
  manifests:{source31:{file:source31File,sha256:hash(oldBytes),build:previous.local},source32:{file:source32File,sha256:hash(newBytes),build:current.local}},
  sourceAfter:verified.receipt,production,unchangedProductionFiles:504,changedProductionFiles:['src/components/keybr/KeybrLessonMode.tsx'],
  normalization:'Source manifest SHA256 comparison normalizes CRLF to LF only. Brand source additionally compares raw bytes against the pinned Git baseline.',
  backend,backendUnchangedFrom31:38,wire,wireUnchangedFrom31:2,brand,brandNormalizedIdenticalToBaseline:21,
  brandRawByteIdenticalToBaseline:brand.filter(row=>row.rawByteIdenticalToBaseline).length,
  brandRawLineEndingQualification:'OpeningExperience.tsx has573CRLF line terminators versusLF at the pinned baseline; its normalized content is identical. No production line endings were changed by this proof.',
  emittedDefaultScene:{directory:'dist',assets,comparisons:quality,originalQualityChecksPassed:5},
  capacityQualification:{status:'SOURCE31-FAILED-CAPACITY-EVIDENCE-REMAINS-APPLICABLE-NOT-A-FRESH-SOURCE32-LOAD-RUN',evidence:capacityFile,evidenceSha256:hash(capacityBytes),recordedAt:capacity.recordedAt,
    full:{status:capacity.full.status,total:capacity.full.total,p95Ms:capacity.full.p95Ms},wire:{status:capacity.wire.status,total:capacity.wire.total,p95Ms:capacity.wire.p95Ms},
    source32LoadRunsPerformedByThisProof:0,reason:'All38 backend production files and both arena wire files remain exact source31 normalized text. A frontend-only change cannot convert the retained source31 failed capacity measurements into a new pass.'},
  priorFrontendFailuresPreserved:true,servicesStarted:0,benchmarksExecuted:0,privateConfigurationRead:false,gitMutations:0,productFilesModified:false};
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,status:report.status,recordedAt:report.recordedAt,production:505,changed:report.changedProductionFiles,backendUnchanged:38,wireUnchanged:2,brandNormalizedBaselineIdentical:21,brandRawBaselineIdentical:report.brandRawByteIdenticalToBaseline,sceneQualityChecks:5,capacityStillFailed:true}));
