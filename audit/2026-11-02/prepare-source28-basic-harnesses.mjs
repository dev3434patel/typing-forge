import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const names = ['freeze-source.mjs', 'run-source-gates.mjs', 'run-input-final.mjs', 'run-final-lighthouse.mjs'];
const oldDirectory = 'audit/2026-10-27';
const newDirectory = 'audit/2026-11-02';
const proofFile = `${newDirectory}/source28-basic-harness-preparation.json`;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rows = [];
await assert.rejects(access(proofFile), { code: 'ENOENT' });
for (const name of names) {
  const originalPath = `${oldDirectory}/${name}`, targetPath = `${newDirectory}/${name}`;
  await assert.rejects(access(targetPath), { code: 'ENOENT' });
  const original = await readFile(originalPath, 'utf8');
  const occurrences = original.split(oldDirectory).length - 1;
  assert.ok(occurrences > 0);
  const candidate = original.replaceAll(oldDirectory, newDirectory);
  assert.equal(candidate.replaceAll(newDirectory, oldDirectory), original);
  rows.push({ originalPath, targetPath, original, candidate, occurrences });
}
for (const row of rows) await writeFile(row.targetPath, row.candidate, { flag: 'wx' });
const report = {
  preparedAt: new Date().toISOString(), status: 'PREPARED-NOT-ACCEPTANCE-RUN',
  onlyChange: 'Report/output directory literal; original commands, thresholds, input driver and full-quality intro protocol remain unchanged.',
  source28RequiresFreshBuild: true, source28FilePrefix: 'final28',
  files: rows.map(row => ({ original: row.originalPath, target: row.targetPath,
    originalSha256: hash(row.original), candidateSha256: hash(row.candidate),
    exactDirectoryReplacements: row.occurrences, reversibleByteIdentity: true })),
};
await writeFile(proofFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ proofFile, prepared: rows.length }));
