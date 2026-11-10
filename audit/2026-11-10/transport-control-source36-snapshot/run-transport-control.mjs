// Two workload processes: this owned echo server/coordinator and one fresh client per phase.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import { freemem, totalmem } from 'node:os';
import { verifyFrozenSource } from '../2026-11-05-followup/artifact-verification.mjs';

assert.equal(process.env.SPAROWTYPE_TRANSPORT_CONTROL_GO, '1', 'Separate root GO is mandatory; preparation does not run the control.');
const directory = 'audit/2026-11-10', preparationFile = `${directory}/transport-control-preparation.json`;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const preparedBytes = await readFile(preparationFile), prepared = JSON.parse(preparedBytes);
assert.equal(sha(preparedBytes), process.env.SPAROWTYPE_TRANSPORT_PREPARATION_SHA256);
const sourceFile = 'audit/2026-11-05-followup/final36-source.json';
const verify = async () => {
  assert.equal(sha(await readFile(preparationFile)), process.env.SPAROWTYPE_TRANSPORT_PREPARATION_SHA256, 'Preparation changed.');
  const source = await verifyFrozenSource(sourceFile);
  assert.equal(source.receipt.compared, 506); assert.deepEqual(source.receipt.mismatches, []);
  assert.equal(source.frozen.local.version, 'd89f84d74519bf2bbae0');
  for (const [file, expected] of Object.entries(prepared.inputHashes)) assert.equal(sha(await readFile(file)), expected, `Frozen control input changed: ${file}`);
  return source.receipt;
};
const sourceBefore = await verify(), marker = randomBytes(16).toString('hex');
const output = `${directory}/transport-control-${marker}.json`, protocolFile = `${directory}/transport-control-${marker}-protocol.json`;
for (const file of [output, protocolFile]) await assert.rejects(access(file), { code: 'ENOENT' });
const order = ['coupled', 'prebuilt', 'prebuilt', 'coupled', 'coupled', 'prebuilt', 'prebuilt', 'coupled'];
const MIN_RAM = 2 * 1024 ** 3, response = JSON.stringify({ transportOnly: true, padding: 'x'.repeat(8192 - JSON.stringify({ transportOnly: true, padding: '' }).length) });
assert.equal(Buffer.byteLength(response), 8192);
const protocol = { declaredAt: new Date().toISOString(), scope: 'TRANSPORT ONLY. Fixed8KiB Node echo response is not Arena/backend/correctness or capacity acceptance.', order, groups: 'A-B-B-A twice; A=coupled, B=prebuilt', freshClientProcessEveryPhase: true, serverProcessShared: true, activeWorkloadProcesses: 2, requestsPerPhase: 400, concurrency: 20, warmupRequests: 0, retries: 0, resultFiltering: false, minFreeMemoryBytesBeforeEachActualHttpPhase: MIN_RAM, prebuiltBytes: 'Full canonical checkpoints; serialized once inside each real API timer in both variants.', responseBytes: 8192, responseSha256: sha(response), sourceBefore, preparation: { file: preparationFile, sha256: sha(preparedBytes) }, noUserConfigurationOrPhpOrDatabase: true, totalMemoryBytes: totalmem() };
await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const report = { status: 'NOTSTARTED', protocol, phases: [], failure: null, cleanup: { serverClosed: false, childClosed: true, forcedChildStop: false } };
let server = null, activeChild = null, state = null, firstPayloads = null;
try {
  assert.ok(freemem() >= MIN_RAM, 'RESOURCE-GATE: below2GiB before listener or client spawn.');
  server = createServer((request, reply) => {
    if (!state || request.method !== 'POST' || request.url !== `/transport/${state.phase}` || request.headers['x-transport-owner'] !== marker) { if (state) state.unexpected++; reply.writeHead(403).end(); return; }
    const actor = Number(request.headers['x-transport-actor']);
    if (!Number.isInteger(actor) || actor < 0 || actor >= 400 || state.seen.has(actor)) { state.unexpected++; reply.writeHead(409).end(); return; }
    state.seen.add(actor); const hash = createHash('sha256'), began = performance.now(); let bytes = 0;
    request.on('data', chunk => { bytes += chunk.length; hash.update(chunk); if (bytes > 2000000) request.destroy(); });
    request.on('error', error => { state.errors.push(error.name); });
    request.on('end', () => {
      state.requests.push({ actorIndex: actor, bytes, sha256: hash.digest('hex'), receiveMs: performance.now() - began });
      reply.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(response), 'X-Transport-Owner': marker, 'Cache-Control': 'no-store' }); reply.end(response);
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  protocol.origin = `http://127.0.0.1:${address.port}/`;
  await writeFile(protocolFile, JSON.stringify(protocol, null, 2) + '\n');
  for (let index = 0; index < order.length; index++) {
    await verify(); assert.ok(freemem() >= MIN_RAM, 'RESOURCE-GATE: below2GiB before phase client spawn.');
    const phase = `g${Math.floor(index / 4) + 1}-${index + 1}-${order[index]}`;
    state = { phase, requests: [], seen: new Set(), unexpected: 0, errors: [] };
    const beforeCpu = process.cpuUsage(), began = performance.now(), beforeRam = freemem();
    const child = fork(`${directory}/transport-control-client.mjs`, [], { execArgv: ['--experimental-transform-types'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true });
    activeChild = child; report.cleanup.childClosed = false;
    let result = null, stdout = '', stderr = '', forced = false;
    child.stdout.on('data', bytes => { if (stdout.length < 2000000) stdout += bytes; });
    child.stderr.on('data', bytes => { if (stderr.length < 2000000) stderr += bytes; });
    const timer = setTimeout(() => { forced = true; child.kill(); }, 190000);
    child.on('message', message => {
      if (message.type === 'boot-ready') child.send({ parentPid: process.pid, marker, phase, variant: order[index], origin: protocol.origin });
      else if (message.type === 'http-ready') {
        if (message.phase !== phase || freemem() < MIN_RAM) { forced = true; child.kill(); return; }
        child.send({ type: 'http-go', phase });
      } else if (message.type === 'complete' && message.phase === phase) result = message.report;
    });
    let code;
    try { code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); }); }
    finally { clearTimeout(timer); activeChild = null; report.cleanup.childClosed = true; report.cleanup.forcedChildStop ||= forced; }
    const requests = state.requests.sort((a, b) => a.actorIndex - b.actorIndex);
    const payloads = requests.map(row => ({ actorIndex: row.actorIndex, bytes: row.bytes, sha256: row.sha256 }));
    const phaseReport = { phase, variant: order[index], clientPid: child.pid, exitCode: code, forcedStop: forced, client: result, server: { requests, unexpected: state.unexpected, errors: state.errors, cpu: process.cpuUsage(beforeCpu), totalPhaseMs: performance.now() - began, beforeFreeMemoryBytes: beforeRam, afterFreeMemoryBytes: freemem(), resource: process.memoryUsage() }, payloadsEqualFirstPhase: firstPayloads === null || JSON.stringify(payloads) === JSON.stringify(firstPayloads), stdout, stderr };
    report.phases.push(phaseReport);
    await writeFile(`${directory}/transport-control-${marker}-${phase}.json`, JSON.stringify(phaseReport, null, 2) + '\n', { flag: 'wx' });
    assert.equal(code, 0); assert.equal(forced, false); assert.equal(result?.status, 'TRANSPORT-ONLY-RECORDED');
    assert.equal(result.requests, 400); assert.equal(requests.length, 400); assert.equal(state.unexpected, 0); assert.deepEqual(state.errors, []);
    assert.ok(result.rawRequests.every((row, actor) => row.actorIndex === actor && row.requestCharacters === payloads[actor].bytes && row.expected));
    assert.equal(phaseReport.payloadsEqualFirstPhase, true, 'Full400-actor request bytes changed across variants.');
    firstPayloads ??= payloads;
    assert.ok(result.resourceFloorDuringRun >= MIN_RAM, 'RESOURCE-GATE: recorded memory floor fell below2GiB; no later phase.');
    await verify();
    console.log(JSON.stringify({ phase, status: result.status, requests: result.requests, p95AllMs: result.p95AllMs, checkpointMs: result.checkpointMs, payloadsEqual: true }));
  }
  report.status = 'TRANSPORT-ONLY-CONTROL-RECORDED';
} catch (error) { report.failure = { name: error.name, message: String(error.message).slice(0, 400) }; report.status = report.phases.length ? 'PARTIAL-FAILED-TRANSPORT-CONTROL' : 'NOTSTARTED-OR-FAILED-PREPARATION'; }
finally {
  if (activeChild) { report.cleanup.forcedChildStop = true; activeChild.kill(); await new Promise(resolve => activeChild.once('close', resolve)); report.cleanup.childClosed = true; }
  if (server?.listening) { server.closeIdleConnections(); await new Promise(resolve => server.close(resolve)); }
  report.cleanup.serverClosed = !server || !server.listening;
  report.sourceAfter = await verify().catch(error => ({ error: error.name }));
  report.finishedAt = new Date().toISOString(); report.finalFreeMemoryBytes = freemem();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ output, status: report.status, phasesRecorded: report.phases.length, cleanup: report.cleanup, failure: report.failure }));
process.exitCode = report.status === 'TRANSPORT-ONLY-CONTROL-RECORDED' ? 0 : 1;
