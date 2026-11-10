import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
const root = 'audit/2026-11-05-followup/core-adoption-prep';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = [
  { destination: 'src/lib/typing-core/session.ts', candidate: 'audit/2026-11-04-followup/core-cache-combinedCache/session.ts', expectedBefore: '5436852d79b166acd708dc07eb67893da0059e3703cd1bc02b8a8fa451d1672c', expectedAfter: 'fb4ad1a1678da5f4399bb2d32a57ab5fc876546b8b018e7f1a2d2c21f6104fbd' },
  { destination: 'src/lib/typing-core/transcript.ts', candidate: 'audit/2026-11-04-followup/core-cache-combinedCache/transcript.ts', expectedBefore: 'd42c6780103f8de4ca4979d5da5a7311ed7b298edbe3925cfeba50704cada1b3', expectedAfter: 'bf91763defa8980fc0670e26f3bba6e4b008452e59fa1f4670419567faa085f8' },
];
const boundary = 'src/lib/typing-core/__tests__/transcript-target-cache.test.ts';
const old = await readFile(boundary, 'utf8');
const start = old.indexOf('  it("allows bounded metadata at 4,096 factory graphemes"');
const end = old.indexOf('  it("never brands external mutable or ordinary frozen public target arrays"');
assert.ok(start > 0 && end > start);
const replacement = `  it("retains the original4,096-grapheme inclusive cache coverage", () => {
    const exercised = exerciseFactory(oneWordOfLength(4096, "inclusive-unit-cache-contract-"));
    expect(exercised.target).toHaveLength(4096);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 1);
  });

  it("caches the former4,097-grapheme outer boundary within the expanded limit", () => {
    const exercised = exerciseFactory(oneWordOfLength(4097, "exclusive-unit-cache-contract-"));
    expect(exercised.target).toHaveLength(4097);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 1);
  });

  it("retains the original512-word inclusive cache coverage", () => {
    const exercised = exerciseFactory(nonemptyWords(512, "inclusive-word-cache-contract"));
    expect(exercised.target.length).toBeLessThan(4096);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 512);
  });

  it("caches the former513-word outer boundary within the expanded limit", () => {
    const exercised = exerciseFactory(nonemptyWords(513, "exclusive-word-cache-contract"));
    expect(exercised.target.length).toBeLessThan(4096);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 513);
  });

  it("allows bounded metadata at8,192 factory graphemes", () => {
    const exercised = exerciseFactory(oneWordOfLength(8192, "expanded-inclusive-unit-cache-"));
    expect(exercised.target).toHaveLength(8192);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 1);
  });

  it("does not retain metadata beyond8,192 factory graphemes", () => {
    const exercised = exerciseFactory(oneWordOfLength(8193, "expanded-exclusive-unit-cache-"));
    expect(exercised.target).toHaveLength(8193);
    expect(exercised.metadataWrites).toEqual([]);
  });

  it("allows at most1,024 frozen numeric Word records", () => {
    const exercised = exerciseFactory(nonemptyWords(1024, "expanded-inclusive-word-cache"));
    expect(exercised.target.length).toBeLessThan(8192);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 1024);
  });

  it("does not retain1,025 Word records even below8,192 graphemes", () => {
    const exercised = exerciseFactory(nonemptyWords(1025, "expanded-exclusive-word-cache"));
    expect(exercised.target.length).toBeLessThan(8192);
    expect(exercised.metadataWrites).toEqual([]);
  });

  it("keeps original and expanded all-space boundaries on exact bounded-retention paths", () => {
    for (const [spaces, wordCount] of [[511, 512], [512, 513], [1023, 1024]]) {
      const exercised = exerciseFactory(" ".repeat(spaces), "  ");
      expect(exercised.metadataWrites.length).toBeLessThanOrEqual(1);
      for (const words of exercised.metadataWrites)
        expectFrozenNumericMetadata(words, wordCount);
      expect(exercised.first.words).toHaveLength(wordCount);
      expect(exercised.first.creditedUnits).toBe(0);
    }
    for (const spaces of [1024, 4096, 8192, 8193]) {
      const exercised = exerciseFactory(" ".repeat(spaces), "  ");
      expect(exercised.first.words).toHaveLength(spaces + 1);
      expect(exercised.first.creditedUnits).toBe(0);
      expect(exercised.metadataWrites).toEqual([]);
    }
  });

`;
const preparedBoundary = `${root}/transcript-target-cache.test.ts`;
await writeFile(preparedBoundary, old.slice(0, start) + replacement + old.slice(end), { flag: 'wx' });
files.push({ destination: boundary, candidate: preparedBoundary, expectedBefore: sha(await readFile(boundary)), expectedAfter: sha(await readFile(preparedBoundary)) });
const contract = { destination: 'src/lib/typing-core/__tests__/checkpoint-result-contract.test.ts', candidate: `${root}/checkpoint-result-contract.test.ts`, expectedBefore: null, expectedAfter: sha(await readFile(`${root}/checkpoint-result-contract.test.ts`)) };
await assert.rejects(access(contract.destination), { code: 'ENOENT' }); files.push(contract);
const syntax = [];
for (const item of files) {
  const bytes = await readFile(item.candidate);
  assert.equal(sha(bytes), item.expectedAfter);
  if (item.expectedBefore) {
    const before = await readFile(item.destination); assert.equal(sha(before), item.expectedBefore);
    item.archive = `${root}/${item.destination.split('/').at(-1)}.before`;
    await writeFile(item.archive, before, { flag: 'wx' });
  }
  const diagnostics = ts.transpileModule(bytes.toString('utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true, fileName: item.destination }).diagnostics ?? [];
  syntax.push({ destination: item.destination, syntaxErrors: diagnostics.filter(row => row.category === ts.DiagnosticCategory.Error).length });
}
assert.ok(syntax.every(row => row.syntaxErrors === 0));
const patches = [];
for (const item of files.filter(row => row.expectedBefore)) {
  let diff;
  try { diff = execFileSync('git', ['diff', '--no-index', '--', item.destination, item.candidate], { windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (error) { assert.equal(error.status, 1); diff = error.stdout; }
  patches.push(diff.replaceAll(`b/${item.candidate}`, `b/${item.destination}`).replaceAll(`+++ b/${item.candidate}`, `+++ b/${item.destination}`));
}
const patch = `${root}/core-adoption-existing-files.patch`;
await writeFile(patch, patches.join('\n'), { flag: 'wx' });
const brandReference = JSON.parse(await readFile('audit/2026-11-04/source34-final-state-identity.json', 'utf8'));
const brand = await Promise.all(brandReference.brandSources.map(async row => { assert.equal(sha(await readFile(row.file)), row.currentRawSha256); return { file: row.file, sha256: row.currentRawSha256 }; }));
const receipt = { status: 'PREPARED-NOT-APPLIED-NO-TESTS', recordedAt: new Date().toISOString(), files, syntax, patch: { file: patch, sha256: sha(await readFile(patch)) }, productionChangesPrepared: 2, existingTestChangesPrepared: 1, newTestFilesPrepared: 1, brand, protectedProfileSha256: sha(await readFile('src/pages/Profile.tsx')), differentialEvidence: 'audit/2026-11-05-followup/checkpoint-differential-result.json', cpuEvidence: 'audit/2026-11-04-followup/checkpoint-cache-cpu-result.json', requiredGatesAfterAdoption: ['Typecheck the FlatAlignmentLeaf primitive-only constraint', 'Full unit suite and PHP replay differential', 'Actual server/client native and capacity gates under the final combined source'], sourceEdited: false, existingTestsEdited: false, testsExecuted: false, applyRequiresNewRootGoAfterPairedHttpClosure: true, limitations: ['The16-entry target map is a strong-reference bound; caller-retained factory arrays can extend weak metadata lifetime.', 'CPU diagnostics do not establish HTTP or browser capacity.', 'Newly prepared boundary/checkpoint tests have syntax checks only.'] };
await writeFile(`${root}/core-adoption-preparation.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, productionFilesPrepared: 2, testFilesPrepared: 2, brandUnchanged: brand.length, files: files.map(row => ({ destination: row.destination, before: row.expectedBefore, after: row.expectedAfter })) }));
