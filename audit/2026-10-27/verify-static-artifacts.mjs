import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { argumentsFor, reserve, json, filesWithin, verifyFrozenSource, workerRouteContract, directStaticRoutes, sceneAssets, qualityBaseline, compareQuality } from './artifact-verification.mjs';

const options = argumentsFor(['--prefix', '--source', '--prior', '--prior-public', '--vercel', '--pages']);
const prefix = options['--prefix'] || 'final5';
const { report, check, finish } = await reserve(prefix, 'static-artifacts');
report.scope = 'Artifact bytes, emitted routes, exact offline allowlist and source/3D integrity only. Browser execution, native devices and actual Vercel/Pages hosting remain separate gates.';
try {
  const sourceFile = options['--source'] || 'audit/2026-10-21/final5-source.json';
  const { receipt } = await verifyFrozenSource(sourceFile); report.source = receipt;
  check('current product source matches frozen final identity', receipt.mismatches.length === 0, receipt);
  const baseline = await qualityBaseline(options['--prior'] || 'audit/mobile-games-static-2026-10-20/static-after5-artifacts.json', options['--prior-public'] || 'audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json');
  report.visualBaseline = { staticReceipt: baseline.priorFile, publicReceipt: baseline.priorPublicFile, staticCheckedAt: baseline.prior.checkedAt, publicCapturedAt: baseline.priorPublic.capturedAt };
  report.artifacts = [];
  for (const [target, directory] of [['vercel', options['--vercel'] || 'dist-static-vercel'], ['github-pages', options['--pages'] || 'dist-static-pages']]) {
    assert.match(directory, /^dist-static-[A-Za-z0-9_-]+$/, 'Use a dedicated workspace static output directory.');
    const all = await filesWithin(directory), config = await json(path.join(directory, 'deployment.json')), build = await json(path.join(directory, 'offline-build.json'));
    const artifact = { directory, deployment: config, build, fileCount: all.length, checks: [] }; report.artifacts.push(artifact);
    const ownCheck = (name, pass, detail) => { artifact.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) }); check(`${target}: ${name}`, pass, detail); };
    ownCheck('explicit static target and API-disabled contract', config.target === target && config.frontendOnly === true && config.api === 'disabled');
    const worker = await readFile(path.join(directory, 'sw.js'), 'utf8');
    ownCheck('worker templates fully injected', !worker.includes('__SPAROWTYPE_'));
    ownCheck('worker static mode declared', /const FRONTEND_ONLY = true;/.test(worker));
    const precache = JSON.parse(worker.match(/const PRECACHE_PATHS = (\[[^;]+\]);/)?.[1] || 'null');
    assert.ok(Array.isArray(precache));
    ownCheck('unique precache count matches metadata', new Set(precache).size === precache.length && precache.length === build.publicFiles);
    ownCheck('precache stays within declared application base', typeof config.base === 'string' && config.base.startsWith('/') && config.base.endsWith('/') && precache.every(file => file.startsWith(config.base) && !file.includes('..') && !/[?#\\]/.test(file)));
    let bytes = 0; for (const file of precache) bytes += (await stat(path.join(directory, file.slice(config.base.length)))).size;
    ownCheck('all exact precache bytes exist and match metadata', bytes === build.bytes);
    ownCheck('no private code, SQL, config, storage, secrets or sourcemaps', !all.some(file => /(?:^|\/)(?:backend|storage|\.git)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|(?:^|\/)config\.php$|\.(?:php|sql|map|pem|key)$/i.test(file)));
    const routeContract = workerRouteContract(worker, true); artifact.offlineRouteContract = routeContract;
    ownCheck('offline public and static-local navigation allowlist is exact', routeContract.exact);
    ownCheck('human/private and unknown dynamic offline paths stay excluded', routeContract.privateOrUnknownExcluded);
    ownCheck('API prefixes bypass worker caching', ['"/api"', '"/auth/v1"', '"/rest/v1"', '"/functions/v1"', '"/storage/v1"', '"/realtime/v1"'].every(value => worker.includes(value)) && worker.includes('request.method !== "GET"') && worker.includes('request.headers.has("authorization")'));
    const html = await readFile(path.join(directory, 'index.html'), 'utf8');
    const urls = [...html.matchAll(/(?:href|src)="([^"]+)"|url\(["']?([^\s)'";]+)["']?\)/g)].map(match => match[1] || match[2]).filter(value => value.startsWith('/'));
    ownCheck('HTML asset references use application base', urls.every(value => value.startsWith(config.base)));
    for (const url of urls) if (/\.(?:js|css|woff2?|svg|png|webmanifest)$/.test(url)) await stat(path.join(directory, url.slice(config.base.length)));
    ownCheck('HTML asset references resolve to emitted files', true);
    const manifest = await json(path.join(directory, 'site.webmanifest'));
    ownCheck('PWA manifest and icons use application base', ['id', 'scope', 'start_url'].every(key => manifest[key] === config.base) && manifest.icons.every(icon => icon.src.startsWith(config.base)));
    for (const route of directStaticRoutes) await stat(path.join(directory, route, 'index.html'));
    artifact.directStaticRoutes = directStaticRoutes;
    ownCheck('all direct static routes including8games and operational pages exist', true);
    const notFound = await readFile(path.join(directory, '404.html'), 'utf8');
    ownCheck('404 has no canonical and remains noindex', !notFound.includes('rel="canonical"') && notFound.includes('noindex,nofollow'));
    for (const route of ['stats', 'settings', 'profile', 'auth', 'ranked', 'studio', 'progression', 'classroom', 'friends', 'arena']) ownCheck(`${route} direct static entry is noindex`, (await readFile(path.join(directory, route, 'index.html'), 'utf8')).includes('noindex,nofollow'));
    if (config.siteUrl) {
      const sitemap = await readFile(path.join(directory, 'sitemap.xml'), 'utf8');
      ownCheck('sitemap stays within declared public site', [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].every(match => match[1].startsWith(config.siteUrl)));
      ownCheck('Pages canonicals preserve directory slashes', target !== 'github-pages' || (await readFile(path.join(directory, 'arcade/word-invaders/index.html'), 'utf8')).includes(`${config.siteUrl}arcade/word-invaders/`));
    }
    artifact.sceneAssets = await sceneAssets(directory, all); artifact.visualComparisons = compareQuality(artifact.sceneAssets, baseline);
    for (const quality of artifact.visualComparisons) ownCheck(`${quality.kind} quality bytes retained from checkpoint`, quality.pass, quality.comparison);
  }
  const first = report.artifacts[0].sceneAssets;
  check('both static targets retain same exact visual render assets', report.artifacts[1].sceneAssets.filter(asset => asset.kind !== 'bridge').every(asset => first.some(other => other.kind === asset.kind && other.file === asset.file && other.sha256 === asset.sha256)));
  check('both static bridges match after one bootstrap import substitution', report.artifacts.every(artifact => artifact.sceneAssets.find(asset => asset.kind === 'bridge').normalizedBootstrapSpecifierSha256 === first.find(asset => asset.kind === 'bridge').normalizedBootstrapSpecifierSha256));
} catch (error) { report.error = { name: error.name, message: error.message }; }
await finish();
