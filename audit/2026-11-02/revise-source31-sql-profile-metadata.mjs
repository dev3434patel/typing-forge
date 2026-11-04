// Preparation metadata only, before any diagnostic runtime. Preserve v1 verbatim.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const directory = 'audit/2026-11-02';
const file = `${directory}/source31-sql-profile-preparation.json`;
const bytes = await readFile(file), manifest = JSON.parse(bytes);
assert.equal(manifest.status, 'PREPARED-NOT-RUN');
assert.equal(manifest.revision, undefined);
const sha = value => createHash('sha256').update(value).digest('hex');
const changes = [];
for (const entry of manifest.adapters) {
  const old = await readFile(entry.file, 'utf8');
  assert.equal(sha(old), entry.sha256);
  let text = old;
  const replacements = [];
  const replace = (before, after) => {
    assert.equal(text.split(before).length, 2);
    text = text.replace(before, after); replacements.push({ before, after, count: 1 });
  };
  if (entry.file.includes('pack-capacity-instance')) {
    replace("legacyFullCommandAndCleanupUnchanged: true, pairOrder: ['capacity31', 'sql-profile31-wire']", "originalOrdinaryOwnerAndDriversPreserved: true, profileOwnerCommandsRestricted: true, cleanupMechanismUnchanged: true, diagnosticOnly: true, ordinaryFullOrWireRunReplaced: false, pairOrder: ['sql-profile31-wire']");
    replace("scope:'Separate current-production-wire1653 operations/50x8/concurrency20; only three server-rebuilt candidate fields are removed by the actual domain helper. All existing assertions and strict p95<150 remain. Newfixtures; sameowner; no full-payload result replacement.'", "scope:'Instrumented diagnostic-only production-wire1653 operations/50x8/concurrency20. Exact original workload/assertions/strict p95<150 retained. Fresh isolated clone/fixture; no ordinary full or wire acceptance result replaced.'");
  } else {
    replace("pairScope: 'Run after legacy full once on the same owned runtime with newly provisioned400-account fixtures. Order/cache effects remain a limitation; no result is overwritten.'", "pairScope: 'Separate instrumented wire-only diagnostic on a fresh owner with400 new fixtures. No preceding full run is required; no ordinary full or wire acceptance result is replaced. Profiling changes overhead.'");
  }
  const combined = [...entry.replacements, ...replacements];
  let reversed = text;
  for (const change of [...combined].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(sha(reversed), entry.originalSha256);
  const syntaxFile = entry.file + '.metadata-syntax-check.mjs';
  await writeFile(syntaxFile, text, { flag: 'wx' });
  const syntax = spawnSync(process.execPath, ['--check', syntaxFile], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
  assert.equal(syntax.status, 0, syntax.stderr);
  changes.push({ file: entry.file, beforeSha256: sha(old), afterSha256: sha(text), replacements, syntaxExitCode: syntax.status, exactCompleteReversal: true });
  await writeFile(entry.file, text);
  entry.replacements = combined;
  entry.sha256 = sha(text);
}
await writeFile(`${directory}/source31-sql-profile-preparation-v1.json`, bytes, { flag: 'wx' });
manifest.revision = 2;
manifest.metadataRevision = { revisedAt: new Date().toISOString(), previousManifest: `${directory}/source31-sql-profile-preparation-v1.json`, previousManifestSha256: sha(bytes), changes, reason: 'Correct inherited full-first/pair descriptions to actual isolated wire-only diagnostic. No runtime existed and no request workload/assertion/timeout/threshold or production file changes.' };
for (const entry of manifest.runtimeFiles) entry.sha256 = sha(await readFile(entry.file));
await writeFile(file, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ status: manifest.status, revision: manifest.revision, files: changes.length, runtimeExecuted: false }));
