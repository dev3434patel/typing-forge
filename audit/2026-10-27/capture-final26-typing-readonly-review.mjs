// Read-only product inspection receipt. No tests, browser, build or benchmark.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { filesWithin, hash, normalizedSourceHash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const baseline = '275c8c24d65054abae18713c1eee4dad18888332';
const directory = 'audit/2026-10-27';
const originalPaths = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', baseline], { encoding: 'utf8', maxBuffer: 1000000 }).trim().split(/\r?\n/));
const describe = async file => {
  const current = await readFile(file), original = originalPaths.has(file) ? execFileSync('git', ['show', `${baseline}:${file}`], { maxBuffer: 10000000 }) : null;
  return { file, currentRawSha256: hash(current), currentNormalizedSha256: normalizedSourceHash(file, current), baselineNormalizedSha256: original ? normalizedSourceHash(file, original) : null,
    baselinePresent: original !== null, normalizedBytesUnchanged: original ? normalizedSourceHash(file, current) === normalizedSourceHash(file, original) : false, rawBytesUnchanged: original ? hash(current) === hash(original) : false };
};
const production = ['src/lib/typing-core/session.ts', 'src/lib/typing-core/transcript.ts', 'src/lib/pressed-key-attribute.ts', 'src/components/typing/LiveKeyboard.tsx', 'src/components/typing/TypingArea.tsx', 'src/components/typing/live-keyboard.css', 'src/lib/live-keyboard.ts', 'src/lib/typing-passage.ts'];
const supporting = ['src/lib/pressed-key-store.ts', 'src/hooks/useLiveKeyboard.ts', 'src/components/typing/ObservedLiveKeyboard.tsx', 'src/components/typing/KeyboardVisualizer.tsx'];
const regressionFiles = ['src/lib/typing-core/__tests__/session.test.ts', 'src/lib/typing-core/__tests__/transcript-target-cache.test.ts', 'src/lib/typing-core/__tests__/live-projection.test.ts',
  'src/lib/__tests__/pressed-key-attribute.test.ts', 'src/lib/__tests__/live-keyboard.test.ts', 'src/lib/__tests__/typing-passage.test.ts', 'src/components/typing/LiveKeyboard.test.tsx',
  'e2e/keycap-attribute-ownership.spec.ts', 'e2e/mobile-input-integrity.spec.ts', 'e2e/live-keyboard.spec.ts'];
const brandPaths = (await filesWithin('src/components/brand')).map(file => `src/components/brand/${file}`);
const brand = await Promise.all(brandPaths.map(describe));
assert.ok(brand.length >= 16 && brand.every(row => row.baselinePresent && row.normalizedBytesUnchanged), 'All brand sources/tests must match the declared baseline; no file omission.');
const externalQualityInputs = await Promise.all(['build/keyboard-worker-plugin.ts', 'build/opening-critical-plugin.ts', 'package.json', 'package-lock.json'].map(describe));
assert.ok(externalQualityInputs.every(row => row.normalizedBytesUnchanged));
const typingArea = (await readFile('src/components/typing/TypingArea.tsx', 'utf8')).replaceAll('\r\n', '\n');
const typingAreaOriginal = execFileSync('git', ['show', `${baseline}:src/components/typing/TypingArea.tsx`], { encoding: 'utf8' }).replaceAll('\r\n', '\n');
assert.equal(typingArea.split('transform 55ms cubic-bezier(.2,.8,.2,1)').length - 1, 1);
assert.equal(typingArea.replace('transform 55ms cubic-bezier(.2,.8,.2,1)', 'transform 85ms cubic-bezier(.2,.8,.2,1)'), typingAreaOriginal, 'Every TypingArea input/focus/IME handler must be byte-identical after reversing its one caret-duration literal.');
const frozen = await verifyFrozenSource(`${directory}/final26-source.json`);
assert.equal(frozen.receipt.compared, 505); assert.deepEqual(frozen.receipt.mismatches, []);
const findings = [{ id: 'TYPING-API-P3-OPTIONAL-STORE-REMOVAL', priority: 'P3', status: 'STATIC-INTERNAL-API-EDGE-UNEXERCISED-BY-CURRENT-PRODUCT-PATHS',
  file: 'src/components/typing/LiveKeyboard.tsx', line: 88,
  condition: 'A mounted keycap first renders with store snapshot false, later receives a held-key imperative data-pressed-key=true write, then changes pressedStore to undefined with staticPressed still false. React may see undefined for both its old and new virtual attribute, leave the imperative true value intact, and the current no-store layout effect does not repair it.',
  currentProductScope: 'ObservedLiveKeyboard creates one stable PressedKeyStore per mounted instance and always passes it. KeyboardVisualizer is a separate always-static caller. No existing user flow that removes the store prop from a mounted keycap was found.',
  impact: 'A future dynamic store-to-static prop transition could show a stale held key. This review does not report dropped input, altered metrics, timing changes or a demonstrated existing user-flow failure.',
  narrowFutureRepair: 'If dynamic optional-store removal becomes supported, synchronize the static pressed=false/remove case in the per-commit repair and add a mounted transition regression. No production edit was made during the frozen acceptance window.',
  verification: 'Static ownership/React-prop analysis, independently agreed by the implementation agent; no browser or mounted reproduction was run in this review.' }];
const report = { status: 'READONLY-REVIEW-COMPLETE-WITH-ONE-INTERNAL-P3', recordedAt: new Date().toISOString(), baseline, frozenSource: frozen.receipt, build: frozen.frozen.local.version,
  production: await Promise.all(production.map(describe)), unchangedSupportingOwnershipSources: await Promise.all(supporting.map(describe)), relatedRegressionFiles: await Promise.all(regressionFiles.map(describe)), findings,
  staticConclusions: [
    'Retained text invalidates before applyEvent, stamps only a completed join and remains independent of clock reads. Canonical valid-input replay/timing behavior is unchanged by the cache.',
    'The alignment record mutation is confined to newly allocated records for private factory-owned dense immutable targets. Ownership is checked after bounded word metadata may be removed; public sparse/getter/proxy inputs keep the prior replacement branch.',
    'Physical feedback owns only data-pressed-key; subscribe-before-sample, active cleanup guards and per-commit store resampling cover live-store notifications, held chords and stale commits. Expected/error/last-input attributes remain React-owned.',
    'Logical-key lookup preserves all-base-before-any-shifted priority and current row identity; the no-extra passage path returns the original slot array. Associated tests cover declared layouts, sparse rows and mutation between calls.',
    'Pressed-key CSS retains each keycap style border geometry and changes only its surface transform. Existing reduced-motion overrides remain. Native geometry/render assertions require the independent browser matrix.',
    'The complete TypingArea file is identical to baseline after reversing one85ms-to55ms caret duration literal; no input, selection, composition, pause, focus, restart or first-input handler changed in this diff.'
  ],
  relatedRegressionIntent: ['Immutable cached snapshots and Unicode/edit/throw invalidation', 'Private-versus-public alignment descriptors/serialization and sparse fallback', 'Synchronous target-event held-key feedback and canonical-correction/blur/restart ownership', 'Frozen SSR markup, composition provenance and all declared logical layouts', 'Rapid native input, composition echo, pause-before-paint and live clock draft integrity', '390/1280 keycap geometry and reduced motion'],
  brandQualitySourceProof: { everyBrandPathIncluded: true, filesCompared: brand.length, everyNormalizedSourceMatchesBaseline: true, rawBytesComparedSeparately: true, files: brand, externalBuildAndDependencyInputs: externalQualityInputs, shaderMaterialLightingCameraPostprocessingSourceChanged: false },
  limitations: ['This is static review and file-hash evidence, not a test execution or runtime certification.', 'The identified optional-store transition remains unexercised by current product paths and was not repaired during the frozen validation window.', 'Pre-existing exceptional applyEvent partial mutation is not made transactional by text caching; the new regression only prevents stale retained text.', 'Browser/device correctness, visual quality and responsiveness must be reported from their actual separate acceptance receipts.'],
  performanceCausalClaim: false, testsOrBenchmarksRun: 0, browsersStarted: 0, downloadsRun: 0, productOrTestEditsMade: false };
const output = `${directory}/final26-typing-product-readonly-review.json`;
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, build: report.build, sourceFiles: frozen.receipt.compared, findings: findings.length, brandFilesCompared: brand.length, allBrandSourcesUnchanged: true, testsRun: 0 }));
