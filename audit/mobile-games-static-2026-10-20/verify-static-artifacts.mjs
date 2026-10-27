import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
const roots = ['dist-static-vercel', 'dist-static-pages'];
async function files(root, prefix = '') {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? files(root, path.join(prefix, entry.name)) : path.join(prefix, entry.name).replaceAll('\\', '/')));
  return groups.flat().sort();
}
const artifacts = [];
for (const root of roots) {
  const all = await files(root);
  const config = JSON.parse(await readFile(path.join(root, 'deployment.json'), 'utf8'));
  const build = JSON.parse(await readFile(path.join(root, 'offline-build.json'), 'utf8'));
  const worker = await readFile(path.join(root, 'sw.js'), 'utf8');
  const precache = JSON.parse(worker.match(/const PRECACHE_PATHS = (\[[^;]+\]);/)?.[1] || 'null');
  const checks = [];
  const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
  check('explicit static API-disabled contract', config.frontendOnly && config.api === 'disabled');
  check('worker templates fully injected', !worker.includes('__SPAROWTYPE_'));
  check('precache count matches metadata', precache?.length === build.publicFiles);
  check('precache remains in application base', precache.every(file => file.startsWith(config.base)));
  let byteCount = 0;
  for (const file of precache) byteCount += (await stat(path.join(root, file.slice(config.base.length)))).size;
  check('all precache files exist with exact byte count', byteCount === build.bytes);
  check('no private backend, SQL, config, env, storage or sourcemaps', !all.some(file => /(?:^|\/)(?:backend|storage|\.env(?:\.|$)|config\.php)(?:\/|$)|\.(?:php|sql|map)$/i.test(file)));
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"|url\(["']?([^\s)'";]+)["']?\)/g)].map(match => match[1] || match[2]).filter(value => value.startsWith('/'));
  check('HTML asset references use application base', urls.every(value => value.startsWith(config.base)));
  for (const url of urls) if (/\.(?:js|css|woff2?|svg|png|webmanifest)$/.test(url)) await stat(path.join(root, url.slice(config.base.length)));
  check('HTML asset references resolve to emitted files', true);
  const manifest = JSON.parse(await readFile(path.join(root, 'site.webmanifest'), 'utf8'));
  check('manifest matches base', ['id', 'scope', 'start_url'].every(key => manifest[key] === config.base) && manifest.icons.every(icon => icon.src.startsWith(config.base)));
  for (const route of ['learn', 'lessons', 'games', 'stats', 'settings', 'profile', 'auth', 'race', 'ranked', 'leaderboard', 'offline', 'keyboard-lab']) await stat(path.join(root, route, 'index.html'));
  check('direct static route entries exist', true);
  check('unknown document has no canonical', !(await readFile(path.join(root, '404.html'), 'utf8')).includes('rel="canonical"'));
  check('operational route is noindex', (await readFile(path.join(root, 'stats/index.html'), 'utf8')).includes('noindex,nofollow'));
  if (config.siteUrl) {
    const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
    check('sitemap URLs remain in declared site', [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].every(match => match[1].startsWith(config.siteUrl)));
    check('Pages canonical matches directory slash', config.target !== 'github-pages' || (await readFile(path.join(root, 'games/index.html'), 'utf8')).includes(`${config.siteUrl}games/`));
  }
  const sceneFiles = all.filter(file => /^assets\/(?:keyboard-scene-|keyboard-bloom-|three\.module-).*\.js$/.test(file));
  const sceneAssets = [];
  for (const file of sceneFiles) {
    const body = await readFile(path.join(root, file));
    const bridge = file.includes('keyboard-scene-bridge-');
    const normalized = bridge ? body.toString('utf8').replace(/from"\.\/index-[A-Za-z0-9_-]+\.js"/g, 'from"./index-BOOTSTRAP.js"') : null;
    sceneAssets.push({ file, kind: bridge ? 'bridge' : file.includes('keyboard-bloom-') ? 'bloom' : file.includes('three.module-') ? 'three' : 'scene', bytes: body.length, gzipBytes: gzipSync(body).length, sha256: createHash('sha256').update(body).digest('hex'), ...(bridge ? { normalizedBootstrapSpecifierSha256: createHash('sha256').update(normalized).digest('hex'), bootstrapSpecifierCount: [...body.toString('utf8').matchAll(/from"\.\/index-[A-Za-z0-9_-]+\.js"/g)].length } : {}) });
  }
  check('full 3D scene, bloom and Three.js chunks retained', sceneAssets.length === 4);
  artifacts.push({ directory: root, deployment: config, build, fileCount: all.length, checks, sceneAssets });
}
const prior = JSON.parse(await readFile('audit/mobile-games-static-2026-10-20/static-artifacts-pre-semantic.json', 'utf8'));
const renderAssets = artifact => artifact.sceneAssets.filter(asset => !asset.file.includes('keyboard-scene-bridge-'));
const sameRendering = (left, right) => left.length === 3 && right.length === 3 && left.every(asset => right.some(other => other.file === asset.file && other.sha256 === asset.sha256 && other.bytes === asset.bytes));
const renderingChunksByteIdenticalAcrossTargets = sameRendering(renderAssets(artifacts[0]), renderAssets(artifacts[1]));
const renderingChunksByteIdenticalFromCheckpoint = artifacts.every(artifact => sameRendering(renderAssets(artifact), renderAssets(prior.artifacts.find(previous => previous.directory === artifact.directory))));
const bridges = artifacts.map(artifact => artifact.sceneAssets.find(asset => asset.kind === 'bridge'));
const bridgeLogicIdenticalAcrossTargets = bridges.every(asset => asset.bootstrapSpecifierCount === 1 && asset.normalizedBootstrapSpecifierSha256 === bridges[0].normalizedBootstrapSpecifierSha256);
const report = { checkedAt: new Date().toISOString(), passed: renderingChunksByteIdenticalAcrossTargets && renderingChunksByteIdenticalFromCheckpoint && bridgeLogicIdenticalAcrossTargets && artifacts.every(artifact => artifact.checks.every(check => check.pass)), renderingChunksByteIdenticalAcrossTargets, renderingChunksByteIdenticalFromCheckpoint, bridgeLogicIdenticalAcrossTargets, bridgeComparison: 'Raw bridge hashes differ because a hashed bootstrap import follows the bundle graph. The normalized comparison replaces exactly that one from"./index-HASH.js" specifier; rendering scene/bloom/Three.js hashes are compared without normalization.', artifacts, hostingExecution: 'Local static file serving only; external Vercel/GitHub Pages deployment remains UNVERIFIED.' };
await writeFile('audit/mobile-games-static-2026-10-20/static-artifacts.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, checks: artifacts.map(artifact => ({ target: artifact.deployment.target, passed: artifact.checks.filter(check => check.pass).length, total: artifact.checks.length })) }));
if (!report.passed) process.exitCode = 1;
