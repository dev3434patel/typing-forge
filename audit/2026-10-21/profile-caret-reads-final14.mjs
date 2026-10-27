import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Preparation is side-effect free until this explicit diagnostic opt-in is set.
assert.equal(process.env.SPAROWTYPE_CARET_READ_DIAGNOSTIC, '1', 'Explicit diagnostic opt-in required');
const directory = 'audit/2026-10-21';
const prefix = process.argv[2] ?? 'final14-caret-reads-diagnostic';
assert.match(prefix, /^final14-[a-z0-9-]+$/);
const originalFile = 'audit/correction-experience-2026-10-20/measure-typing.mjs';
const sourceFile = `${directory}/final14-source.json`;
const generatedFile = `${directory}/.${prefix}.generated.mjs`;
const paths = [generatedFile, `${directory}/${prefix}-protocol.json`, `${directory}/${prefix}.json`, `${directory}/${prefix}.cpuprofile`, `${directory}/${prefix}-functions.json`, `${directory}/${prefix}-reads.json`];
for (const file of paths) await assert.rejects(access(file), { code: 'ENOENT' });
const original = await readFile(originalFile, 'utf8');
const frozen = JSON.parse(await readFile(sourceFile, 'utf8'));
assert.equal(frozen.local.version, '945bd4aa37e6b3c9ec40');
const served = await fetch('http://127.0.0.1:4173/offline-build.json').then(response => {
  assert.equal(response.ok, true);
  return response.json();
});
assert.deepEqual(served, frozen.local);
let generated = original;
const replacements = [];
const replaceOnce = (from, to, description) => {
  assert.equal(generated.split(from).length, 2, `Unique replacement required: ${description}`);
  generated = generated.replace(from, to);
  replacements.push({ description, from, to });
};
replaceOnce("const directory = 'audit/correction-experience-2026-10-20';", `const directory = '${directory}';`, 'Report directory only');
replaceOnce('  let resize = null;', `  await page.evaluate(() => {
    const input = document.querySelector('textarea[aria-label="Typing input"]');
    if (!(input instanceof HTMLTextAreaElement)) throw new Error('Diagnostic typing input missing');
    const methods = ['getClientRects', 'getBoundingClientRect'];
    const descriptors = new Map(methods.map(name => [name, Object.getOwnPropertyDescriptor(Element.prototype, name)]));
    const state = { calls: [], capped: false, sequence: 0, byInputLength: {}, installed: true };
    window.caretReadDiagnostic = state;
    for (const name of methods) {
      const descriptor = descriptors.get(name);
      if (!descriptor || typeof descriptor.value !== 'function') throw new Error('Native geometry method unavailable: ' + name);
      const native = descriptor.value;
      Object.defineProperty(Element.prototype, name, { ...descriptor, value: function (...args) {
        // Invoke the original exactly once with identical receiver/arguments.
        // Native throws escape unchanged; instrumentation never replaces a result.
        const result = Reflect.apply(native, this, args);
        try {
          const atLength = input.value.length;
          const counts = state.byInputLength[atLength] ??= { getClientRects: 0, getBoundingClientRect: 0, glyphClientRects: 0, zeroWidthGlyphClientRects: 0 };
          counts[name]++;
          const rawIndex = this.dataset?.slotIndex;
          if (rawIndex !== undefined && name === 'getClientRects') {
            counts.glyphClientRects++;
            const rect = result[0];
            if (rect && rect.width <= 0) counts.zeroWidthGlyphClientRects++;
            if (state.calls.length < 20_000) {
              state.calls.push({ sequence: state.sequence++, atLength, index: Number(rawIndex), expected: this.dataset.expected ?? null,
                status: this.dataset.status ?? null, fragmentPresent: !!rect, width: rect?.width ?? null, height: rect?.height ?? null,
                // Home has no opponent marker. A future target-index query is
                // the bounded forward collector, not the current native anchor.
                forwardQuery: Number(rawIndex) > atLength });
            } else state.capped = true;
          }
        } catch { /* Diagnostic accounting must not alter native DOM behavior. */ }
        return result;
      } });
    }
    state.restore = () => {
      for (const [name, descriptor] of descriptors) Object.defineProperty(Element.prototype, name, descriptor);
      state.installed = false;
    };
  });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.start');
  let resize = null;`, 'Entry-only native geometry accounting and CDP profile before unchanged native input');
replaceOnce('  const observation = await page.evaluate(() => window.typingBench);', `  const { profile } = await cdp.send('Profiler.stop');
  await writeFile(directory + '/${prefix}.cpuprofile', JSON.stringify(profile), { flag: 'wx' });
  const functions = new Map();
  for (const node of profile.nodes) {
    const frame = node.callFrame;
    const key = (frame.functionName || '(anonymous)') + ' ' + frame.url + ':' + frame.lineNumber + ':' + frame.columnNumber;
    functions.set(key, (functions.get(key) || 0) + (node.hitCount || 0));
  }
  await writeFile(directory + '/${prefix}-functions.json', JSON.stringify({ scope: 'Instrumented diagnostic; hit counts are sampled CPU hits, not invocation counts or acceptance.', sampledFunctions: [...functions].sort((a,b) => b[1]-a[1]).slice(0,80) }, null, 2), { flag: 'wx' });
  const reads = await page.evaluate(() => {
    const state = window.caretReadDiagnostic;
    try { return { byInputLength: state.byInputLength, calls: state.calls, capped: state.capped }; }
    finally { state.restore(); }
  });
  const zeroWidthQueries = reads.calls.filter(call => call.fragmentPresent && call.width <= 0);
  const zeroWidthForwardSpaces = zeroWidthQueries.filter(call => call.forwardQuery && call.expected === ' ');
  await writeFile(directory + '/${prefix}-reads.json', JSON.stringify({ scope: 'Native geometry calls grouped by textarea UTF16 length at call entry. Native result objects and exact geometry are unchanged. Future glyph queries on this Home practice path come from the forward collector; zero-width forward queries are source-supported cache-stop candidates, not an independent cache-hit counter.', build, capped: reads.capped, totalMethods: Object.values(reads.byInputLength).reduce((sum, row) => ({ getClientRects: sum.getClientRects + row.getClientRects, getBoundingClientRect: sum.getBoundingClientRect + row.getBoundingClientRect }), { getClientRects: 0, getBoundingClientRect: 0 }), zeroWidthQueries, zeroWidthForwardSpaces, ...reads }, null, 2), { flag: 'wx' });
  const observation = await page.evaluate(() => window.typingBench);`, 'Stop profile, export safe native-call accounting, restore prototypes, then original observation/export/assertions');

// Prove that instrumentation did not alter the original action/assertion source.
let restored = generated;
for (const replacement of [...replacements].reverse()) restored = restored.replace(replacement.to, replacement.from);
assert.equal(restored, original);
const sha = source => createHash('sha256').update(source).digest('hex');
await writeFile(generatedFile, generated, { flag: 'wx' });
await writeFile(`${directory}/${prefix}-protocol.json`, JSON.stringify({
  declaredAt: new Date().toISOString(), status: 'DECLARED-NOT-RUN', scope: 'One explicitly instrumented diagnostic, not acceptance or a replacement for failed source13 runs. No retries, filtering, visual overrides, clock mutation, geometry changes or production edits.',
  build: frozen.local, sourceFile, originalFile, originalSha256: sha(original), generatedFile, generatedSha256: sha(generated),
  originalActionAndAssertionSourceRestoredExactly: true, instrumentation: ['CDP CPU Profiler', 'Element.prototype native geometry entry accounting, identical receiver/arguments and result identity', 'Per-textarea-UTF16-length counts, bounded20000 glyph observations, raw first-fragment dimensions', 'Restore native method descriptors before original result export'],
  cpuThrottle: 4, repetitions: 16, characters: 495, interCharacterDelayMs: 0, freshContext: true, viewport: { width: 390, height: 844 }, realRotation: { width: 844, height: 390 }, fontsAndFiniteAnimationsSettled: true,
  automaticRetries: 0, filtering: false, watchdogMs: 150000, historicalAcceptance: `${directory}/final14-input-results.json`,
  limitations: ['Instrumentation adds overhead; timing values are diagnostic only.', 'A measured future SPACE with nonpositive width identifies a source-supported collector stop; cached hit/miss state is not directly instrumented.', 'Counters use textarea length when native geometry executes, including observer/resize/result work, not an inferred event attribution.', 'Raw CPU profile stays ignored; this known synthetic passage contains no account credentials or private typed content.'],
}, null, 2), { flag: 'wx' });
process.env.TYPING_BENCH_CPU_RATE = '4';
process.env.TYPING_BENCH_REPETITIONS = '16';
process.env.TYPING_BENCH_DELAY_MS = '0';
process.env.TYPING_BENCH_SETTLE = '1';
process.env.TYPING_BENCH_REPORT_NAME = prefix;
process.env.TYPING_BENCH_BUILD_FILE = sourceFile;
await import(`./.${prefix}.generated.mjs`);
