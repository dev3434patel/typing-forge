import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const file = 'src/pages/Profile.tsx', archived = 'audit/2026-11-05-followup/Profile.tsx.before-layout-fix';
const before = await readFile(archived, 'utf8'), after = await readFile(file, 'utf8');
let expected = before.replace("import { lazy,Suspense,useEffect,useState } from 'react';", "import { lazy,Suspense,useEffect,useLayoutEffect,useState } from 'react';");
expected = expected.replace("const ProfileAppearance = lazy(() => import('@/components/progression/ProfileAppearance'));", "const ProfileAppearance = lazy(() => import('@/components/progression/ProfileAppearance'));\nconst useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;");
expected = expected.replace("  useEffect(()=>{setConfirmation('');setMessage('');},[ownerId]);", "  useIsomorphicLayoutEffect(()=>{setConfirmation('');},[ownerId]);\n  useEffect(()=>{setMessage('');},[ownerId]);");
assert.equal(after.replaceAll('\r\n', '\n'), expected.replaceAll('\r\n', '\n'));
const source = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(source.receipt.compared, 505);
assert.deepEqual(source.receipt.mismatches.map(row => typeof row === 'string' ? row : row.file), [file]);
const brandReference = JSON.parse(await readFile('audit/2026-11-04/source34-final-state-identity.json', 'utf8'));
for (const row of brandReference.brandSources) assert.equal(sha(await readFile(row.file)), row.currentRawSha256);
const test = 'e2e/profile-confirmation-readiness.spec.ts';
const syntax = [file, test].map(path => ({ file: path, errors: ts.transpileModule(execFileSync(process.execPath, ['-e', `process.stdout.write(require('fs').readFileSync(${JSON.stringify(path)},'utf8'))`], { windowsHide: true }).toString(), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true, fileName: path }).diagnostics?.filter(row => row.category === ts.DiagnosticCategory.Error).map(row => ts.flattenDiagnosticMessageText(row.messageText, ' ')) ?? [] }));
assert.ok(syntax.every(row => row.errors.length === 0));
const patchFile = 'audit/2026-11-05-followup/profile-layout-fix.patch';
await writeFile(patchFile, execFileSync('git', ['diff', '--', file], { windowsHide: true }), { flag: 'wx' });
const receipt = {
  status: 'APPLIED-FROZEN-SYNTAX-ONLY-NO-RUNTIME', recordedAt: new Date().toISOString(),
  file, before: { archived, sha256: sha(await readFile(archived)) }, afterSha256: sha(await readFile(file)), exactPatch: { file: patchFile, sha256: sha(await readFile(patchFile)) },
  scope: 'Move confirmation reset to isomorphic layout effect before paint on initial mount and every actual owner change; retain separate passive message clear and unchanged reset action. No ref skip, owner-scoped draft cache, timing/metric or 3D change.',
  source505Comparison: source.receipt, onlyApprovedProfileProductionDelta: true, all21BrandSourcesUnchanged: true,
  regression: { file: test, sha256: sha(await readFile(test)), cases: ['early native fill survives course history/paint and durable reset', 'real owner transition A→B→A clears confirmation each time'] },
  syntax, semanticTypecheckExecuted: false, ssrRuntimeExecuted: false, ssrGuard: "typeof window === 'undefined' ? useEffect : useLayoutEffect", testsExecuted: false,
  originalSevenPassOneFailRetained: true, originalHistorical60SecondCauseNotRetrospectivelyClaimed: true,
  requiresFreshFrontendBuildBeforePostFixNativeProbe: true,
};
await writeFile('audit/2026-11-05-followup/profile-layout-fix-preparation.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, afterSha256: receipt.afterSha256, changedFrozenSourceFiles: source.receipt.mismatches.length, brandFilesUnchanged: 21, syntaxErrors: 0 }));
