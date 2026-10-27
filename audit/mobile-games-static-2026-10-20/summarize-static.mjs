import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory = 'audit/mobile-games-static-2026-10-20/';
const load = async name => JSON.parse(await readFile(directory + name, 'utf8'));
const browsers = await load('static-browser-final.json');
const artifacts = await load('static-artifacts.json');
const actions = await load('static-action-pins.json');
const gameAxe = await load('static-game-axe-final.json');
const sourceGatesReceipt = 'checks-final-source-summary-20261020T191056Z.json';
const sourceGates = await load(sourceGatesReceipt);
const files = ['build/deployment-config.mjs', 'src/lib/deployment.ts', 'src/lib/pwa.ts', 'src/lib/seo.ts', 'src/lib/opening-experience.ts', 'src/services/php-api.ts', 'src/App.tsx', 'src/workspace-loader.ts', 'src/components/layout/Header.tsx', 'src/index.css', 'src/components/brand/keyboard-scene-bridge.ts', 'src/lib/typing-game.ts', 'src/components/games/SignalRun.tsx', 'src/components/games/SignalScene.tsx', 'vite.config.ts', 'public/sw.js', 'scripts/build-frontend.mjs', 'scripts/build-offline.mjs', 'scripts/test-frontend.mjs', 'vercel.json', '.github/workflows/github-pages.yml', 'e2e/frontend-static-server.ts', 'e2e/frontend-deployment.spec.ts', 'e2e/frontend-game-accessibility.spec.ts'];
const sourceHashes = {};
for (const file of files) sourceHashes[file] = createHash('sha256').update(await readFile(file)).digest('hex');
const mainPreview = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const summary = {
  recordedAt: new Date().toISOString(),
  releaseRevision: 'after5',
  scope: 'Explicit frontend-only Vercel root and GitHub Pages project-subpath contracts; PHP default remains separate.',
  runtime: { expected: browsers.stats.expected, unexpected: browsers.stats.unexpected, flaky: browsers.stats.flaky, skipped: browsers.stats.skipped, engines: ['Chromium', 'Microsoft Edge', 'Firefox', 'Playwright WebKit'], casesPerEngine: 10, checks: ['direct nested directory routes and refresh', 'asset/font/manifest/base boundaries', 'disabled auth/ranked/human with usable local bot', 'corrected guest session saves, history, JSON export, preference persistence', 'local structured-course checkpoint', 'service-worker scope and game/local routes during a real origin outage'], network: 'Every case asserts no application API, external-origin or out-of-base request; no API mocks or live backend are used.' },
  focusedUnits: { passed: 97, files: 8, receipts: ['static-focused-tests-after5.log', 'static-opening-critical-after5.log'], scope: '94 deployment/PWA/SEO/PHP-transport checks plus3 separate opening-critical plugin checks; the combined set includes the original89-case scope.' },
  testCollection: { status: 'HISTORICAL PASS', tests: 266, files: 48, receipt: 'static-full-test-collection.log', note: 'Earlier complete collection after fixing Node import compatibility; preserved as a checkpoint. New after5 loader coverage and the final parent browser matrix are recorded separately. This is not claimed as an after5 recollection.' },
  typecheck: { status: 'PASS', receipt: sourceGatesReceipt, exitCode: sourceGates.checks.find(check => check.name === 'typecheck').exitCode },
  integratedSourceGates: { status: sourceGates.status, count: sourceGates.checks.length, unitTests: 959, unitFiles: 69, receipt: sourceGatesReceipt, provenance: 'Executed sequentially by ui_quality after the final conditional home-only workspace-loader fix; this summary references that receipt without claiming another run.' },
  scopedLint: { status: 'PASS', receipt: sourceGates.checks.find(check => check.name === 'lint').log, scope: 'Final parent-coordinated full configured source lint, referenced without another execution.' },
  artifacts: artifacts.artifacts.map(artifact => ({ directory: artifact.directory, target: artifact.deployment.target, base: artifact.deployment.base, build: artifact.build, checksPassed: artifact.checks.filter(check => check.pass).length, checksTotal: artifact.checks.length })),
  actionPins: { passed: actions.passed, total: actions.total, receipt: 'static-action-pins.json', remoteExecution: 'UNVERIFIED' },
  gameAxe: { expected: gameAxe.stats.expected, unexpected: gameAxe.stats.unexpected, statesPerCase: 3, widths: [390, 1440], targets: ['vercel', 'github-pages'], engine: 'Chromium', defaultAxeRuleSet: true },
  rendering: { renderingChunksByteIdenticalAcrossTargets: artifacts.renderingChunksByteIdenticalAcrossTargets, renderingChunksByteIdenticalFromCheckpoint: artifacts.renderingChunksByteIdenticalFromCheckpoint, bridgeLogicIdenticalAcrossTargets: artifacts.bridgeLogicIdenticalAcrossTargets, note: artifacts.bridgeComparison },
  brandLifecycleRepair: 'The worker bridge intentionally gained synchronous pending-startup termination. Rendering scene, bloom and Three.js chunks remain byte-identical; root separately reports15 other brand source files unchanged. This report does not claim the bridge source is unchanged.',
  preservedCheckpoints: { after1: 'static-after1-preservation.json', after4: 'static-after4-preservation.json', note: 'Earlier40-case static acceptance runs are checkpoints. Final after5 source additionally prevents Auth/Stats/nonhome routes from waiting for an unused Index chunk while preserving parallel home-route preparation. Header, bridge-lifecycle and game-assistance repairs are retained. No after2/after3 static builds were produced.' },
  preservedFailures: [
    { receipt: 'static-focused-tests-initial.log', cause: 'New CacheStorage fixture returned one consumed Response repeatedly; corrected fixture to clone responses like the browser Cache API. No production cache change needed.' },
    { receipt: 'static-chromium-initial.json', unexpected: 2, expected: 8, cause: 'New test expected 75%; UI correctly formats 75.0%. Assertion now targets the precise correct cell.' },
    { cause: 'Root full-suite collection found unguarded import.meta.env in the new deployment helper; guarded Node imports, added a plain-Node subprocess regression and recollected the full suite successfully. That guard emitted identical bundles at the pre-semantic checkpoint.' },
    { receipt: 'static-artifacts-overbroad-bridge-comparison.json', cause: 'The initial global comparison incorrectly required bridge bytes to match even when hashed bootstrap import names changed. Final evidence preserves raw bridge hashes and narrowly normalizes just that one import; actual rendering chunks are compared without normalization.' }
  ],
  baselinePreviewPreservedDuringStaticWork: { version: '7f5214eec1843304c7a0', receipt: 'static-verification-summary-pre-semantic.json' },
  productionBuildObservedAfterRootIntegration: mainPreview,
  outputIsolation: 'This agent built only dist-static-vercel and dist-static-pages; root owns the subsequent production dist build.',
  sourceStabilityReceipt: 'static-after5-source-end.json',
  hostingConfigurationAndDevelopmentBoundary: {
    vercelPermissionsPolicy: { receipt: 'vercel-header-verification.json', scope: 'The camera/microphone/geolocation/gyroscope restriction was restored after after4 acceptance and before after5. Only staged configuration is checked; local directory-server tests do not claim actual Vercel response-header verification. This hosting-header setting does not alter compiled assets.' },
    phpPackagingRetry: { receipt: 'hosting-package-verification.json', scope: 'A bounded Windows-only retry was added to the same atomic directory rename. Root recreated and byte-checked the fresh hosting package; this helper change does not alter compiled web assets.' },
    viteDevelopmentFileBoundary: { receipt: 'dev-file-boundary-verification.json', scope: 'Before after5 acceptance, Vite development-only fs.deny gained private PHP configuration/storage and generated hosting paths while retaining installed Vite defaults. Eight fresh-canary URL variants are denied while the public course catalog/module and isolated API proxy remain available. No actual private file was requested. Root separately owns full CLI dev/lesson verification and production asset identity.' },
  },
  limitations: ['No external Vercel or GitHub Pages deployment performed.', 'No hosted Actions run, custom-domain DNS or TLS verified.', 'Playwright WebKit is not a real iOS hardware acceptance test.', 'Browser persistence/offline availability remains subject to storage permissions and eviction.', 'Static builds intentionally cannot authenticate, sync, validate ranked scores or host human rooms.', 'Project paths share browser-origin storage and are not a personal-data security boundary.'],
  sourceHashes,
};
await writeFile(directory + 'static-verification-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ browsersPassed: summary.runtime.expected, browserFailures: summary.runtime.unexpected, artifactChecks: summary.artifacts.map(artifact => `${artifact.checksPassed}/${artifact.checksTotal}`), originalPreviewVersion: mainPreview.version }));
