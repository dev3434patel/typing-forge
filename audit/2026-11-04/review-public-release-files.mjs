import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { access, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Export filenames, line numbers and fingerprints only; never matching values.
const output = process.argv[2];
assert.match(output ?? '', /^audit\/2026-11-04\/[a-z0-9-]+\.json$/);
await assert.rejects(access(output), { code: 'ENOENT' });
const listed = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8', windowsHide: true });
assert.equal(listed.status, 0);
const files = new Set(listed.stdout.split('\0').filter(Boolean));
const reviewedLogRoots = ['audit/2026-10-21', 'audit/2026-10-27', 'audit/2026-11-02', 'audit/2026-11-04'];
for (const root of reviewedLogRoots) {
  for (const item of await readdir(root, { withFileTypes: true })) {
    if (item.isFile() && item.name.endsWith('.log')) files.add(`${root}/${item.name}`);
  }
}
const forbidden = /(?:^|\/)(?:node_modules|backend\/storage|\.final[^/]*|\.playwright-artifacts[^/]*|verified-head-[^/]*)(?:\/|$)|(?:^|\/)backend\/config\.php$|(?:^|\/)\.env(?:\.|$)(?!example$)|\.(?:exe|dll|zip|7z|cpuprofile)$/i;
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['aws-access-id', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g],
  ['stripe-secret', /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g],
  ['literal-session-cookie', /(?:PHPSESSID|sparowtype_session)=[A-Za-z0-9,-]{20,}/g],
];
const findings = [], forbiddenPaths = [], inventory = [];
let textFiles = 0, textBytes = 0, allBytes = 0;
for (const file of [...files].sort()) {
  if (file === output) continue;
  if (forbidden.test(file)) forbiddenPaths.push(file);
  const info = await stat(file);
  if (!info.isFile()) continue;
  const bytes = await readFile(file);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  allBytes += bytes.length;
  const text = !bytes.includes(0) && !/\.(?:png|jpe?g|webp|gif|ico|woff2?|mp[34]|ogg|webm|pdf)$/i.test(file);
  inventory.push({ file, bytes: bytes.length, sha256, textScanned: text });
  if (!text) continue;
  textFiles++;
  textBytes += bytes.length;
  const content = bytes.toString('utf8');
  for (const [kind, pattern] of patterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) findings.push({ file, kind, line: content.slice(0, match.index).split('\n').length });
  }
}
const result = {
  recordedAt: new Date().toISOString(),
  status: findings.length || forbiddenPaths.length ? 'REVIEW-REQUIRED' : 'PASS-SCOPED',
  scope: 'Tracked and unignored working-tree files plus direct public audit logs. Pattern scan only; this is not a comprehensive security audit. Newly generated files after this snapshot require a new scan.',
  scannerSha256: createHash('sha256').update(await readFile('audit/2026-11-04/review-public-release-files.mjs')).digest('hex'),
  fileCount: inventory.length, textFiles, textBytes, allBytes,
  largest: [...inventory].sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  forbiddenPaths, findings, inventory,
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: result.status, fileCount: result.fileCount, textFiles, textBytes, allBytes, forbiddenPaths, findings }));
process.exitCode = result.status === 'PASS-SCOPED' ? 0 : 1;
