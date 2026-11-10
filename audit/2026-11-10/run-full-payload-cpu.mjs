import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { freemem } from 'node:os';
import { SessionController } from '../../src/lib/typing-core/index.ts';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const directory = 'audit/2026-11-10', output = `${directory}/full-payload-cpu-result.json`;
for (const file of [output, `${directory}/full-payload-cpu-fixture.json`, `${directory}/full-payload-index-candidate.php`]) await assert.rejects(access(file), { code: 'ENOENT' });
assert.equal(process.env.PHP_BINARY, 'C:/xampp/php/php.exe');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['backend/public/index.php', 'backend/src/RequestBody.php', 'backend/src/ArenaRules.php', 'backend/src/CompetitiveInputPolicy.php', 'backend/src/SessionValidator.php', 'backend/src/CourseAssessment.php', 'src/lib/typing-core/session.ts', 'src/lib/typing-core/metrics.ts', 'src/lib/typing-core/transcript.ts'];
const sourceHashes = Object.fromEntries(await Promise.all(sources.map(async file => [file, hash(await readFile(file))])));
const service = await readFile('backend/src/ArenaService.php', 'utf8');
const words = [...service.match(/private const WORDS=\[([^\]]+)\]/)[1].matchAll(/'([a-z]+)'/g)].map(match => match[1]);
assert.equal(words.length, 24);
const target = Array.from({ length: 800 }, (_, i) => words[i % words.length]).join(' ');
const owner = '11111111-1111-4111-8111-111111111111', roomId = '22222222-2222-4222-8222-222222222222';
let mono = 0;
const wall = Date.UTC(2026, 10, 10, 0, 0, 0);
const controller = new SessionController({ mode:'race', durationMs:30000, language:'en', script:'Latin', keyboardLayout:'qwerty', inputMethod:'keyboard', scoringPolicy:'prose', contentRevision:'sparow-arena-v1', challengeId:`arena:${roomId}`, correctionPolicy:'current-word', privacy:'public-corpus', settings:{arenaId:roomId,localBot:false}, clientSessionId:'arena-cpu-full800', ownerScope:owner, initialTarget:target }, {now:()=>mono, wallNow:()=>wall+mono});
controller.startAt(0, wall);
for (let i = 0; i < 10; i++) { mono = 100 + i * 83; controller.input({type:'insert',text:target[i]}); }
mono = 2000;
const candidate = controller.checkpoint();
assert.equal(candidate.metrics.insertionAttempts, 10);
assert.equal(candidate.elapsedMs, 2000);
const raw = JSON.stringify({code:'ABCDEFGH',candidate,finish:false,expectedOwner:owner});
await writeFile(`${directory}/full-payload-cpu-fixture.json`, raw, {flag:'wx'});

const originalIndex = await readFile('backend/public/index.php', 'utf8');
const marker = '    $validator = null; $data = null;';
assert.equal(originalIndex.split(marker).length, 2);
const addition = "    if ($arenaAction === 'submit') {\n        unset($raw);\n        if (is_array($body['candidate'] ?? null)) {\n            foreach (['characters', 'timeSeries', 'cursor'] as $field) {\n                if (array_key_exists($field, $body['candidate'])) $body['candidate'][$field] = null;\n            }\n        }\n    }\n";
const derivedIndex = originalIndex.replace(marker, addition + marker);
assert.equal(derivedIndex.replace(addition, ''), originalIndex);
await writeFile(`${directory}/full-payload-index-candidate.php`, derivedIndex, {flag:'wx'});

const runtime = phpRuntime(), schedule = Array.from({length:6}, () => ['A','B','B','A']).flat();
const report = { declaredAt:new Date().toISOString(), status:'RUNNING', scope:'Fresh single-process CLI CPU/allocation diagnostic only; no HTTP/server/database, no capacity acceptance.', sourceHashes, fixture:{bytes:Buffer.byteLength(raw),sha256:hash(raw),words:800,characters:candidate.characters.length,events:candidate.events.length,elapsedMs:2000,authoritativeReplayElapsedMs:2300,realSessionController:true,injectedClockForMicroOnly:true}, candidate:{file:`${directory}/full-payload-index-candidate.php`,sha256:hash(derivedIndex),exactInsertionReversal:true,metricsRetained:true,existingSlotsReplacedWithNullOnly:true,rawJsonReleasedAfterFullDecode:true}, runtime:{binary:runtime.binary,args:[...runtime.args,'-d','memory_limit=45M'],managedLimitBytes:45*1024*1024,gcDisabled:false,nodeObservedRssBytes:process.memoryUsage().rss,nodeHeapUsedBytes:process.memoryUsage().heapUsed,freeMemoryBeforeBytes:freemem()}, schedule, automaticRetries:0, samples:[] };
await writeFile(output, JSON.stringify(report,null,2)+'\n', {flag:'wx'});
let reference = null;
for (let i = 0; i < schedule.length; i++) {
  const variant = schedule[i];
  const run = spawnSync(runtime.binary, [...runtime.args,'-d','memory_limit=45M',`${directory}/full-payload-cpu.php`,variant], {input:raw,encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:1024*1024});
  await writeFile(`${directory}/full-payload-cpu-${String(i+1).padStart(2,'0')}${variant}.stdout.json`, run.stdout ?? '', {flag:'wx'});
  await writeFile(`${directory}/full-payload-cpu-${String(i+1).padStart(2,'0')}${variant}.stderr.log`, run.stderr ?? '', {flag:'wx'});
  let data = null; try { data = JSON.parse(run.stdout); } catch { /* Raw failure is preserved above. */ }
  const sample = {index:i+1,variant,exitCode:run.status,signal:run.signal,error:run.error?{name:run.error.name,code:run.error.code}:null,data};
  report.samples.push(sample);
  let valid = run.status === 0 && !run.error && data?.status === 'PASS-SCOPED-CPU-ONLY' && data.metricClaimRetained === true && data.peakAllocatedBytes <= 50_000_000 && data.inputSha256 === report.fixture.sha256;
  if (valid && reference === null) reference = {hashes:data.hashes,order:data.canonicalPropertyOrder};
  if (valid) valid = JSON.stringify(data.hashes) === JSON.stringify(reference.hashes) && JSON.stringify(data.canonicalPropertyOrder) === JSON.stringify(reference.order);
  sample.exactCanonicalAndReplayParity = valid;
  if (!valid) { report.status='FAILED-PRESERVED-STOPPED'; await writeFile(output,JSON.stringify(report,null,2)+'\n'); console.log(JSON.stringify({output,status:report.status,sample:i+1,exitCode:run.status,data})); process.exitCode=1; break; }
  await writeFile(output, JSON.stringify(report,null,2)+'\n');
}
if (report.samples.length === 24 && report.samples.every(row => row.exactCanonicalAndReplayParity)) {
  for (const [file,expected] of Object.entries(sourceHashes)) assert.equal(hash(await readFile(file)),expected,'Production source changed during the microprobe.');
  const median = values => { const s=[...values].sort((a,b)=>a-b); return (s[(s.length-1)>>1]+s[s.length>>1])/2; };
  report.summary = Object.fromEntries(['A','B'].map(variant => {
    const samples = report.samples.filter(row=>row.variant===variant).map(row=>row.data);
    return [variant,{samples:samples.length,medianTimesMs:Object.fromEntries(Object.keys(samples[0].times).map(key=>[key,median(samples.map(row=>row.times[key]))])),medianMemory:Object.fromEntries(Object.keys(samples[0].memory).map(stage=>[stage,{usedBytes:median(samples.map(row=>row.memory[stage].usedBytes)),allocatedBytes:median(samples.map(row=>row.memory[stage].allocatedBytes))}])),peakManagedAllocatedBytes:Math.max(...samples.map(row=>row.peakAllocatedBytes))}];
  }));
  report.status='PASS-SCOPED-24-FRESH-PHP-CPU-SAMPLES';
  report.qualification='Single valid representative checkpoint, not full semantic certification, HTTP capacity, clean-host stability or proof of a production speed improvement. Timings are host-sensitive; PHP managed allocation is capped45M. Node fixture/orchestrator runtime RSS is separately disclosed and is not the PHP managed-memory figure.';
  report.productionSourceUnchanged=true;
  report.finishedAt=new Date().toISOString();
  report.freeMemoryAfterBytes=freemem();
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output,status:report.status,summary:report.summary,fixture:report.fixture,productionSourceUnchanged:true}));
}
