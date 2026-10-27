import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const audit = 'audit/2026-10-21';
const prefix = 'final12-mobile-profile-diagnostic';
const originalFile = `${audit}/measure-mobile-workspaces.mjs`;
const generated = `${audit}/.${prefix}.generated.mjs`;
const protocolFile = `${audit}/${prefix}-protocol.json`;
const buildFile = `${audit}/${prefix}-build.json`;
const receiptFile = `${audit}/${prefix}-process.json`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
for (const name of [generated, protocolFile, buildFile, receiptFile, `${audit}/${prefix}.json`])
  await assert.rejects(access(name), { code: 'ENOENT' });
const original = await readFile(originalFile, 'utf8');
let source = original;
const begin = "  await cdp.send('Emulation.setCPUThrottlingRate', { rate: protocol.cpuThrottle });";
const finish = "  const observation = await page.evaluate(() => {\n    const { observers, ...value } = window.mobileWorkspaceBench;";
assert.equal(source.split(begin).length, 2);
assert.equal(source.split(finish).length, 2);
source = source.replace(begin, `${begin}\n  page.mobileProfileCdp = cdp;\n  await cdp.send('Profiler.enable');\n  await cdp.send('Profiler.start');`);
source = source.replace(finish, `  const { profile } = await page.mobileProfileCdp.send('Profiler.stop');
  const caseId = new URL(page.url()).pathname.split('/').filter(Boolean).at(-1);
  assert.ok(['learn', 'lessons', 'race', 'games'].includes(caseId));
  await writeFile(directory + '/${prefix}-' + caseId + '.cpuprofile', JSON.stringify(profile), { flag: 'wx' });
  const functions = new Map();
  for (const node of profile.nodes) {
    const frame = node.callFrame;
    const key = (frame.functionName || '(anonymous)') + ' ' + frame.url + ':' + frame.lineNumber + ':' + frame.columnNumber;
    functions.set(key, (functions.get(key) || 0) + (node.hitCount || 0));
  }
  await writeFile(directory + '/${prefix}-' + caseId + '-functions.json', JSON.stringify({
    scope: 'Instrumented CPU diagnostic of frozen source12 frontend-only artifact. Samples are not call counts or causal percentages; timings do not replace acceptance.',
    sampledFunctions: [...functions].sort((a, b) => b[1] - a[1]).slice(0, 80),
  }, null, 2), { flag: 'wx' });
${finish}`);
const artifactDirectory = 'dist-static-final12-vercel';
const build = JSON.parse(await readFile(`${artifactDirectory}/offline-build.json`, 'utf8'));
assert.equal(build.version, 'cb595b29fcd212b6a58a');
const protocol = JSON.parse(await readFile(`${audit}/mobile-workspaces-final12-static-protocol.json`, 'utf8'));
let temporary, server;
const receipt = { declaredAt: new Date().toISOString(), status: 'RUNNING', scope: 'Separate profiler diagnostic; does not replace the retained source12 mobile acceptance result.',
  originalFile, originalSha256: digest(original), generatedSha256: digest(source), artifactDirectory, build, changedActions: false,
  instrumentation: 'CDP Profiler starts after CPU throttling, stops after the existing observation ends; same cases, native input, timing and all assertions.',
};
try {
  const require = createRequire(import.meta.url);
  const { build: compile } = createRequire(require.resolve('vite'))('esbuild');
  temporary = await mkdtemp(path.join(tmpdir(), 'sparow-mobile-profile-'));
  const helper = path.join(temporary, 'static-server.mjs');
  await compile({ entryPoints: ['e2e/frontend-static-server.ts'], outfile: helper, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  const { startFrontendStaticServer } = await import(pathToFileURL(helper).href);
  server = await startFrontendStaticServer(artifactDirectory);
  const actualProtocol = { ...protocol, declaredAt: receipt.declaredAt, origin: server.baseURL.replace(/\/$/, ''), buildFile,
    instrumentedDiagnostic: true, acceptance: false, scope: receipt.scope };
  await writeFile(buildFile, JSON.stringify({ local: build }, null, 2), { flag: 'wx' });
  await writeFile(protocolFile, JSON.stringify(actualProtocol, null, 2), { flag: 'wx' });
  await writeFile(generated, source, { flag: 'wx' });
  process.argv = [process.execPath, generated, prefix, protocolFile];
  await import(`./.${prefix}.generated.mjs`);
  receipt.status = process.exitCode ? 'FAILED' : 'PASS-SCOPED';
} catch (error) {
  receipt.status = 'FAILED'; receipt.error = { name: error.name, message: error.message };
  process.exitCode = 1;
} finally {
  await server?.stop(); receipt.ownedServerClosed = Boolean(server);
  if (temporary) {
    assert.equal(path.dirname(temporary), path.resolve(tmpdir()));
    assert.match(path.basename(temporary), /^sparow-mobile-profile-/);
    await rm(temporary, { recursive: true, force: true });
  }
  receipt.originalDriverUnchanged = digest(await readFile(originalFile)) === receipt.originalSha256;
  receipt.artifactMetadataUnchanged = JSON.stringify(JSON.parse(await readFile(`${artifactDirectory}/offline-build.json`, 'utf8'))) === JSON.stringify(build);
  receipt.finishedAt = new Date().toISOString();
  await writeFile(receiptFile, JSON.stringify(receipt, null, 2), { flag: 'wx' });
}
