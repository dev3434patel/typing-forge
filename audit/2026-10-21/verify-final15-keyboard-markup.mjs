import { readFile, writeFile, unlink, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const directory = 'audit/2026-10-21';
const receipt = `${directory}/final15-keyboard-markup-parity.json`;
await assert.rejects(access(receipt), { code: 'ENOENT' });
const originalFile = `${directory}/.final15-LiveKeyboard-baseline.tsx`;
const currentFile = 'src/components/typing/LiveKeyboard.tsx';
const original = await readFile(originalFile, 'utf8');
const current = await readFile(currentFile, 'utf8');
const frozen = JSON.parse(await readFile(`${directory}/final14-source.json`, 'utf8'));
const sha = source => createHash('sha256').update(source.replaceAll('\r\n', '\n')).digest('hex');
assert.equal(sha(original), frozen.sourceHashes[currentFile]);
const fixtures = JSON.parse(await readFile('src/components/typing/__fixtures__/live-keyboard-render-v1.json', 'utf8'));
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild');
const temporary = [];
try {
  const load = async (source, name) => {
    const target = path.resolve(`${directory}/.final15-${name}-markup.cjs`);
    await assert.rejects(access(target), { code: 'ENOENT' });
    const result = await build({ stdin: { contents: source, resolveDir: path.resolve('src/components/typing'), loader: 'tsx' },
      bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
      alias: { '@': path.resolve('src') }, loader: { '.css': 'empty' } });
    await writeFile(target, result.outputFiles[0].contents, { flag: 'wx' });
    temporary.push(target);
    return require(target);
  };
  const before = await load(original, 'before');
  const after = await load(current, 'after');
  const cases = [];
  for (const fixture of fixtures.cases) {
    const props = { layout: 'qwerty', language: 'en', input: { pressedCodes: [], focused: false, composing: false, deadKey: false, capsLock: null },
      visible: true, fingerGuide: true, onVisibilityChange: () => undefined, ...fixture.props };
    const baseline = renderToStaticMarkup(createElement(before.LiveKeyboard, props));
    const optimized = renderToStaticMarkup(createElement(after.LiveKeyboard, props));
    assert.equal(optimized, baseline, fixture.id);
    assert.equal(createHash('sha256').update(baseline).digest('hex'), fixture.sha256, fixture.id);
    cases.push({ id: fixture.id, byteEqual: true, bytes: Buffer.byteLength(baseline), sha256: fixture.sha256 });
  }
  await writeFile(receipt, JSON.stringify({ capturedAt: new Date().toISOString(), status: 'PASS-SCOPED-FRESH-SSR-BYTE-PARITY',
    baselineFile: originalFile, baselineFreeze: `${directory}/final14-source.json`, baselineSha256: sha(original), baselineMatchesFrozen14: true,
    currentFile, currentSha256: sha(current), cases: cases.length, exactHtmlByteEqual: true, details: cases,
    harnessDependency: 'Vite-owned nested installed esbuild; preserves standalone automatic JSX and package-external React SSR',
    limits: 'Standalone SSR comparison against actual preserved source14 component. No browser, application build, timing or visual screenshot verification performed.' }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ cases: cases.length, byteEqual: true, receipt }));
} finally {
  await Promise.all(temporary.map(file => unlink(file)));
}
