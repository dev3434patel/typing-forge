// Filesystem-only identity proof. No build, browser, service, test or benchmark.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, readFile, writeFile } from 'node:fs/promises';
import { verifyFrozenSource, filesWithin, sceneAssets, publicOfflineRoutes, directStaticRoutes, normalizedSourceHash } from '../2026-11-05-followup/artifact-verification.mjs';
const output = 'audit/2026-11-10/source37-frontend-artifact-reuse-proof.json';
await assert.rejects(access(output), { code: 'ENOENT' });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const bind = async file => ({ file, sha256: sha(await readFile(file)) });
const streamHash = file => new Promise((resolve, reject) => { const digest = createHash('sha256'), stream = createReadStream(file); stream.on('data', bytes => digest.update(bytes)); stream.once('error', reject); stream.once('end', () => resolve(digest.digest('hex'))); });
const previousFile = 'audit/2026-11-05-followup/final36-source.json', currentFile = 'audit/2026-11-05-followup/final37-source.json';
const previous = await json(previousFile), current = await json(currentFile);
assert.equal(Object.keys(current.sourceHashes).length, 506);
assert.deepEqual(Object.keys(current.sourceHashes).sort(), Object.keys(previous.sourceHashes).sort());
const changedProductionFiles = Object.keys(current.sourceHashes).filter(file => current.sourceHashes[file] !== previous.sourceHashes[file]);
assert.deepEqual(changedProductionFiles, ['backend/public/index.php']);
assert.equal(current.sourceHashes['backend/public/index.php'], 'ace06732ab6996e13525e08dbb41dff441109c94c18650db937985d5ae2f5c78');
assert.deepEqual(current.local, previous.local); assert.deepEqual(current.local, current.served);
const frontend = Object.keys(current.sourceHashes).filter(file => !file.startsWith('backend/')).sort();
assert.equal(frontend.length, 468); assert.ok(frontend.every(file => current.sourceHashes[file] === previous.sourceHashes[file]));
const source = (await verifyFrozenSource(currentFile)).receipt;
assert.equal(source.compared, 506); assert.deepEqual(source.mismatches, []);
const oldProofFile = 'audit/2026-11-05-followup/source36-frontend-build-reuse-proof.json', oldProof = await json(oldProofFile);
const actualDefaultFiles = await filesWithin('dist');
assert.deepEqual(actualDefaultFiles, Object.keys(oldProof.currentAllArtifactSha256).sort());
for (const [file, expected] of Object.entries(oldProof.currentAllArtifactSha256)) assert.equal(sha(await readFile(`dist/${file}`)), expected);
assert.equal(actualDefaultFiles.length, 142);
const brand = await Promise.all(oldProof.brand.map(async row => { const bytes = await readFile(row.file); assert.equal(sha(bytes), row.rawSha256); assert.equal(normalizedSourceHash(row.file, bytes), row.normalizedSha256); return row; }));
assert.equal(brand.length, 21);
const oldStaticFile = 'audit/2026-11-05-followup/final36-static-artifacts.json', oldStatic = await json(oldStaticFile);
assert.equal(oldStatic.status, 'PASS-SCOPED');
const template = await readFile('public/sw.js', 'utf8'), staticArtifacts = [];
const publicRoutes = publicOfflineRoutes.filter(route => !['/offline', '/race', '/leaderboard'].includes(route));
const withoutCanonical = value => value.replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '').replace(/<meta\b[^>]*property="og:url"[^>]*>/gi, '');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const old of oldStatic.artifacts) {
  const directory = old.directory, all = await filesWithin(directory), deployment = await json(`${directory}/deployment.json`), build = await json(`${directory}/offline-build.json`);
  assert.deepEqual(deployment, old.deployment); assert.deepEqual(build, old.build); assert.equal(all.length, old.fileCount); assert.equal(all.length, 178);
  const worker = await readFile(`${directory}/sw.js`, 'utf8');
  const paths = JSON.parse(worker.match(/const PRECACHE_PATHS = (\[[^;]+\]);/)[1]);
  assert.equal(paths.length, build.publicFiles); assert.equal(new Set(paths).size, paths.length);
  const digest = createHash('sha256').update(template).update(JSON.stringify({ base: deployment.base, frontendOnly: true }));
  const published = {}, relative = new Set(); let bytes = 0;
  for (const path of paths) { assert.ok(path.startsWith(deployment.base) && !path.includes('..')); const file = path.slice(deployment.base.length), body = await readFile(`${directory}/${file}`); digest.update(path); digest.update(body); bytes += body.length; published[path] = sha(body); relative.add(file); }
  assert.equal(digest.digest('hex').slice(0, 20), old.build.version); assert.equal(bytes, old.build.bytes);
  const expectedWorker = template.replace('__SPAROWTYPE_BUILD__', build.version).replace('/*__SPAROWTYPE_PRECACHE__*/ []', JSON.stringify(paths)).replace('/*__SPAROWTYPE_BASE__*/ "/"', JSON.stringify(deployment.base)).replace('/*__SPAROWTYPE_STATIC__*/ false', 'true');
  assert.equal(worker, expectedWorker);
  const html = await readFile(`${directory}/index.html`, 'utf8'), derived = {};
  const expectBytes = async (file, expected) => { const body = await readFile(`${directory}/${file}`); assert.deepEqual(body, Buffer.from(expected)); derived[file] = sha(body); };
  await expectBytes('sw.js', expectedWorker); await expectBytes('.nojekyll', '');
  await expectBytes('deployment.json', JSON.stringify(old.deployment, null, 2) + '\n');
  await expectBytes('offline-build.json', JSON.stringify(old.build, null, 2));
  for (const file of ['_headers', 'fonts/inter-LICENSE.txt', 'fonts/jetbrains-mono-LICENSE.txt', 'fonts/sora-LICENSE.txt']) await expectBytes(file, await readFile(`public/${file}`));
  const aliases = { '/typing-test': '/', '/typing-practice': '/learn', '/practice': '/learn' };
  const publicPath = route => deployment.base + (deployment.target === 'github-pages' && route !== '/' ? route + '/' : route).replace(/^\/+/, '');
  for (const route of directStaticRoutes) {
    let entry = withoutCanonical(html), slashRoute = '/' + route;
    if (!publicRoutes.includes(slashRoute)) entry = entry.replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>');
    else if (deployment.siteUrl) { const canonical = new URL(publicPath(aliases[slashRoute] || slashRoute), new URL(deployment.siteUrl).origin).href; entry = entry.replace('</head>', `<link rel="canonical" href="${escape(canonical)}"><meta property="og:url" content="${escape(canonical)}"></head>`); }
    await expectBytes(`${route}/index.html`, entry);
  }
  await expectBytes('404.html', withoutCanonical(html).replace('</head>', '<meta name="robots" content="noindex,nofollow"></head>'));
  const cleanRobots = (await readFile('public/robots.txt', 'utf8')).replace(/^Sitemap:.*$/gm, '').trimEnd();
  const origin = new URL(deployment.siteUrl).origin;
  await expectBytes('robots.txt', cleanRobots + `\nSitemap: ${new URL(deployment.base + 'sitemap.xml', origin).href}\n`);
  await expectBytes('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicRoutes.map(route => `<url><loc>${escape(new URL(publicPath(route), origin).href)}</loc></url>`).join('')}</urlset>`);
  const unanchoredExtras = all.filter(file => !relative.has(file) && !(file in derived));
  assert.deepEqual(unanchoredExtras, ['.vite/manifest.json']);
  const vite = await json(`${directory}/.vite/manifest.json`);
  for (const entry of Object.values(vite)) { for (const file of [entry.file, ...(entry.css || []), ...(entry.assets || [])]) assert.ok(all.includes(file)); for (const key of [...(entry.imports || []), ...(entry.dynamicImports || [])]) assert.ok(key in vite); }
  const scenes = await sceneAssets(directory, all); assert.deepEqual(scenes, old.sceneAssets);
  const allArtifactSha256 = Object.fromEntries(await Promise.all(all.map(async file => [file, sha(await readFile(`${directory}/${file}`))])));
  staticArtifacts.push({ directory, deployment, build, fileCount: all.length, publishedFiles: paths.length, publishedBytes: bytes, publishedContentIdMatchesPriorReceipt: true, publishedSha256: published, exactDerivedExtraFiles: Object.keys(derived).length, derivedExtraSha256: derived, allArtifactSha256, historicalFull178HashMapAvailable: false, unanchoredHistoricalMetadata: unanchoredExtras, metadataStructuralValidation: true, sceneAssets: scenes, historicalQualification: 'All133 published bytes reproduce the prior contentID.44 additional files exactly match unchanged generator/source plus anchored index and old deployment metadata. No old178-file map is invented: exact historical .vite/manifest.json bytes are UNVERIFIED; its present references are valid and its current SHA is recorded.' });
}
const ciFile = 'audit/2026-11-05-followup/final36-ci-extra.json', ci = await json(ciFile);
assert.equal(ci.status, 'PASS-SCOPED');
for (const [file, expected] of Object.entries(ci.protocol.inputHashes)) assert.equal(await streamHash(file), expected);
for (const [file, expected] of Object.entries(ci.protocol.runtimeInputHashes)) assert.equal(await streamHash(file), expected);
const matrixFile = 'audit/2026-11-09/source36-functional-recovery.json', matrix = await json(matrixFile);
assert.equal(matrix.status, 'PASS-SCOPED-RECOVERED-FUNCTIONAL-MATRIX');
const dependencies = [...(await filesWithin('e2e')).filter(file => !file.includes('/') && file.endsWith('.ts')).map(file => `e2e/${file}`), 'playwright.config.ts'].sort();
const dependencyHashes = Object.fromEntries(await Promise.all(dependencies.map(async file => [file, sha(await readFile(file))])));
assert.equal(dependencies.length, 73); assert.equal(sha(JSON.stringify(dependencyHashes)), matrix.currentDependencies.sha256);
const evidenceFiles = [matrixFile, oldProofFile, oldStaticFile, ciFile, 'audit/2026-11-05-followup/final36-static-process.json', 'audit/2026-11-05-followup/final36-native-browser.json', 'audit/2026-11-05-followup/source36-native20-dependency-guard.json', 'audit/2026-11-09/source36-release-checks.json', 'audit/2026-11-09/webkit-capture-diagnostic/result.json'];
const result = { status: 'PASS-SCOPED-SOURCE37-UNCHANGED-FRONTEND-REUSE', recordedAt: new Date().toISOString(), manifests: await Promise.all([previousFile, currentFile].map(bind)), source, build: current.local, changedProductionFiles, unchangedFrontendFiles: frontend.length, unchangedFrontendSourceHashes: Object.fromEntries(frontend.map(file => [file, current.sourceHashes[file]])), defaultArtifact: { fileCount: actualDefaultFiles.length, allBytesEqualPriorSource36Map: true, allArtifactSha256: oldProof.currentAllArtifactSha256 }, brandSourcesUnchanged: brand.length, brand, staticArtifacts, dependencies: { count: dependencies.length, sha256: sha(JSON.stringify(dependencyHashes)) }, boundEvidence: await Promise.all(evidenceFiles.map(bind)), reuse: { clientMatrix: { files: 65, totals: matrix.totals, unchangedCompiledClientAndDependencies: true, originalSkipsRetained: true, source37BackendClaim: false }, static: { priorArtifactChecks: 67, priorDeploymentCases: 56, priorGameAccessibilityCases: 16, qualification: 'Reuse unchanged client/static observations; complete prior178-byte maps do not exist. The one historical metadata-only manifest pertarget remains explicitly unanchored.' }, ci: { actualOriginalPGliteAndDenoPasses: true, allCapturedInputsAndRuntimeBytesUnchanged: true, commandsRerun: false }, native20: { reuse: 'CONDITIONAL-NON-ARENA-ONLY', requirement: 'Source37 actual-index nonArena routing/error contracts must pass. The new block is conditional on Arena submit only; old native20 cannot certify its new Arena branch.', newArenaRuntimeAcceptance: 'REQUIRED-SEPARATELY' }, performance: 'No source37 latency, Lighthouse, transport or capacity measurement is supplied by this file-only proof.', webkitViewport: 'Prior automated passes remain scoped to their actual runner. Nov9 diagnostic records DPR/viewport mismatch at nominal390/1440; no new exact-viewport or native Safari claim.' }, noBuildBrowserServiceOrBenchmarkStarted: true, productionOrTestsEdited: false };
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: result.status, sha256: sha(await readFile(output)), sourceFiles: source.compared, frontend: frontend.length, defaultFiles: actualDefaultFiles.length, static: staticArtifacts.map(row => ({ directory: row.directory, files: row.fileCount, published: row.publishedFiles, derived: row.exactDerivedExtraFiles, unanchoredHistoricalMetadata: row.unanchoredHistoricalMetadata })) }));
