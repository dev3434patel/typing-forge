import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const root = 'audit/2026-11-04';
const proposal = JSON.parse(await readFile(`${root}/source34-three-failure-helper-proposal-v2.json`, 'utf8'));
const files = ['e2e/helpers.ts', 'e2e/arena.spec.ts', 'e2e/progression-extras.spec.ts', 'e2e/typing-course.spec.ts'];
await mkdir(`${root}/test-sync-before`, { recursive: true });
const edits = [];
let patch = '';
for (const file of files) {
  const archive = `${root}/test-sync-before/${file.split('/').at(-1)}`;
  let original;
  try { original = await readFile(archive); }
  catch (error) { if (error.code !== 'ENOENT') throw error; original = await readFile(file); await writeFile(archive, original, { flag: 'wx' }); }
  const before = original.toString('utf8');
  const eol = before.includes('\r\n') ? '\r\n' : '\n';
  let after = before;
  const replacements = [];
  if (file !== 'e2e/typing-course.spec.ts') {
    const planned = proposal.proposedEdits.find(row => row.file === file);
    assert.equal(hash(original), planned.currentSha256);
    for (const change of planned.changes) {
      const from = change.from.replaceAll('\n', eol), to = change.to.replaceAll('\n', eol);
      assert.equal(after.split(from).length, 2, `Unique replacement: ${file}`);
      const index = after.indexOf(from);
      after = after.replace(from, to); replacements.push({ from, to, index });
    }
  } else {
    const from = '  await page.getByLabel("Type DELETE to enable this action", { exact: true }).fill("DELETE");\n  await page.getByRole("button", { name: "Reset guest workspace", exact: true }).click();'.replaceAll('\n', eol);
    const to = [
      '  const confirmation = page.getByLabel("Type DELETE to enable this action", { exact: true });',
      '  await expect(confirmation).toBeVisible();',
      '  await expect(confirmation).toBeEnabled();',
      '  await confirmation.fill("DELETE");',
      '  await expect(confirmation).toHaveValue("DELETE");',
      '  const reset = page.getByRole("button", { name: "Reset guest workspace", exact: true });',
      '  await expect(reset).toBeEnabled();',
      '  await reset.click();',
      '  await expect(page.getByRole("status").filter({ hasText: "This device workspace has been reset." })).toBeVisible();',
      '  await expect.poll(() => page.evaluate(() => {',
      '    const marker = JSON.parse(localStorage.getItem("sparowtype.workspace-reset.v1:guest") ?? "null") as { ownerId?: string; id?: string; at?: number } | null;',
      '    return marker?.ownerId === "guest" && typeof marker.id === "string" && marker.id.length > 0 && typeof marker.at === "number" && Number.isFinite(marker.at) && marker.at > 0;',
      '  })).toBe(true);',
    ].join(eol);
    assert.equal(after.split(from).length, 2, 'Unique course reset action');
    const index = after.indexOf(from);
    after = after.replace(from, to); replacements.push({ from, to, index });
  }
  let reversed = after;
  for (const replacement of [...replacements].reverse()) {
    assert.equal(reversed.slice(replacement.index, replacement.index + replacement.to.length), replacement.to, `Exact reverse span: ${file}`);
    reversed = reversed.slice(0, replacement.index) + replacement.from + reversed.slice(replacement.index + replacement.to.length);
  }
  assert.equal(reversed, before);
  const current = await readFile(file);
  assert.ok(hash(current) === hash(original) || current.toString('utf8') === after, `Unexpected partial edit: ${file}`);
  await writeFile(file, after);
  const syntax = ts.transpileModule(after, { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).diagnostics ?? [];
  assert.equal(syntax.filter(row => row.category === ts.DiagnosticCategory.Error).length, 0);
  const diff = spawnSync('git', ['diff', '--no-index', '--', archive, file], { encoding: 'utf8', windowsHide: true });
  assert.ok(diff.status === 1, `Expected patch for ${file}`);
  patch += diff.stdout;
  edits.push({ file, archive, beforeSha256: hash(original), afterSha256: hash(after), exactReverse: true, originalLineEndingsRetained: true, syntaxErrors: 0, changes: replacements });
}
const frozen = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(frozen.receipt.compared, 505); assert.deepEqual(frozen.receipt.mismatches, []);
const baseline = JSON.parse(await readFile('audit/2026-11-02/final34-existing-protocol.json', 'utf8'));
const unmodified = [];
for (const [file, expected] of Object.entries(baseline.testHashes)) {
  if (files.includes(file)) continue;
  const actual = hash(await readFile(file)); assert.equal(actual, expected, `Unintended input changed: ${file}`); unmodified.push({ file, sha256: actual });
}
await writeFile(`${root}/source34-test-synchronization.patch`, patch);
const receipt = { recordedAt: new Date().toISOString(), status: 'STABLE-SYNTAX-ONLY-NOT-RUN', proposal: 'source34-three-failure-helper-proposal-v2.json', edits, patch: { file: `${root}/source34-test-synchronization.patch`, sha256: hash(patch) }, source: frozen.receipt, allOtherGuardedInputsUnchanged: true, unmodified, followupFiles: ['e2e/arena.spec.ts', 'e2e/account-workspace.spec.ts', 'e2e/progression-extras.spec.ts', 'e2e/typing-experience.spec.ts', 'e2e/typing-course.spec.ts'], originalCase1014Cause: 'UNVERIFIED; unchanged original diagnostic passed. Added completion witness addresses independently demonstrated asynchronous-reset/hard-navigation gap, not a proven cause of the original timeout.', retained: { originalTimeouts: true, originalTypingCadence: true, originalAssertions: true, retriesZero: true, noRuntimeFollowupYet: true, productionFrozen505Unchanged: true } };
await writeFile(`${root}/source34-test-synchronization-adoption.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ stable: true, changedTestFiles: edits.length, unchangedGuardedInputs: unmodified.length, productionCompared: frozen.receipt.compared, edits: edits.map(({ file, beforeSha256, afterSha256 }) => ({ file, beforeSha256, afterSha256 })) }));
