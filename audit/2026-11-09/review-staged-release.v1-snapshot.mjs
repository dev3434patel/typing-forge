import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';

const output = process.argv[2];
assert.match(output ?? '', /^audit\/2026-11-09\/[a-z0-9-]+\.json$/);
await assert.rejects(access(output), { code: 'ENOENT' });
const git = args => {
  const result = spawnSync('git', args, { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0);
  return result.stdout;
};
const paths = git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR']).split('\0').filter(Boolean).sort();
const stagedNameStatusTokens = git(['diff', '--cached', '--name-status', '-z']).split('\0').filter(Boolean);
assert.ok(paths.length, 'Stage the explicit reviewed release paths before this check.');
const index = new Map(git(['ls-files', '--stage', '-z']).split('\0').filter(Boolean).map(row => {
  const [, mode, hash, stage, file] = /^(\d+) ([a-f0-9]+) (\d)\t([\s\S]+)$/.exec(row);
  assert.equal(stage, '0');
  return [file, { mode, hash }];
}));
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['aws-access-id', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g],
  ['stripe-secret', /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g],
  ['literal-session-cookie', /(?:PHPSESSID|sparowtype_session)=[A-Za-z0-9,-]{20,}/g],
];
const forbidden = /(?:^|\/)(?:node_modules|backend\/storage|\.final[^/]*|\.playwright-artifacts[^/]*|verified-head-[^/]*)(?:\/|$)|(?:^|\/)backend\/config\.php$|(?:^|\/)\.env(?:\.|$)(?!example$)|\.(?:exe|dll|zip|7z|cpuprofile)$/i;
const unreviewedRuntime = /^audit\/[^/]+\/(?:\.[^/]*artifacts|[^/]*-artifacts)(?:\/|$)/i;
const findings = [], forbiddenPaths = [], indexMismatches = [], decodingIssues = [], inventory = [];
let allBytes = 0, textFiles = 0;
for (const file of paths) {
  if (forbidden.test(file) || unreviewedRuntime.test(file) || !['100644', '100755'].includes(index.get(file)?.mode)) {
    forbiddenPaths.push(file);
    inventory.push({ file, mode: index.get(file)?.mode ?? null, contentRead: false, reason: 'Forbidden path or non-regular index mode; rejected before content I/O.' });
    continue;
  }
  const workingBytes = await readFile(file);
  let bytes = workingBytes;
  const workingBlobHash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  let lineEndingNormalizationOnly = false;
  if (workingBlobHash !== index.get(file)?.hash) {
    const indexed = spawnSync('git', ['show', `:${file}`], { windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
    assert.equal(indexed.status, 0);
    bytes = indexed.stdout;
    try {
      const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(workingBytes);
      lineEndingNormalizationOnly = Buffer.from(text.replace(/\r\n/g, '\n')).equals(bytes);
    } catch { /* Invalid UTF8 is never treated as a line-ending difference. */ }
    if (!lineEndingNormalizationOnly) indexMismatches.push(file);
  }
  const blobHash = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(blobHash, index.get(file)?.hash, 'Scanned bytes must be the actual indexed blob.');
  let encoding = null, content = null;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = 'utf16le-bom';
    try { content = new TextDecoder('utf-16le', { fatal: true }).decode(bytes.subarray(2)); } catch { decodingIssues.push(file); }
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff && bytes.length % 2 === 0) {
    encoding = 'utf16be-bom';
    try { content = new TextDecoder('utf-16be', { fatal: true }).decode(bytes.subarray(2)); } catch { decodingIssues.push(file); }
  } else if (!/\.(?:png|jpe?g|webp|gif|ico|woff2?|mp[34]|ogg|webm|pdf)$/i.test(file)) {
    try {
      content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const nulCount = bytes.reduce((count, byte) => count + (byte === 0 ? 1 : 0), 0);
      if (nulCount / Math.max(1, bytes.length) >= 0.1) decodingIssues.push(file);
      encoding = nulCount ? 'utf8-with-sparse-nul' : 'utf8';
    } catch { decodingIssues.push(file); }
  }
  if (content !== null) {
    textFiles++;
    for (const [kind, pattern] of patterns) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) findings.push({ file, kind, line: content.slice(0, match.index).split('\n').length });
    }
  }
  allBytes += bytes.length;
  inventory.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), gitBlobHash: blobHash, stagedBlobMatchesScannedBytes: true, workingBytesIdentical: workingBlobHash === blobHash, lineEndingNormalizationOnly, textEncoding: encoding });
}
const result = {
  recordedAt: new Date().toISOString(),
  status: findings.length || forbiddenPaths.length || indexMismatches.length || decodingIssues.length ? 'REVIEW-REQUIRED' : 'PASS-SCOPED',
  scope: 'Actual added/modified/copied/renamed index paths, including staged-only files. All name/status tokens, including deletions, are retained for separate intent review. Reject forbidden paths and non-regular index modes before reading content. Scan actual indexed bytes; a working/index difference is permitted only for exact CRLF-to-LF normalization preserving BOM and is recorded. UTF-16 BOM logs and valid UTF8 text with sparse NULs are decoded explicitly; ambiguous NUL-heavy or invalid text requires review. Binary media are identified, not text-scanned. This is a declared-pattern and staging-scope check, not comprehensive security certification.',
  scannerSha256: createHash('sha256').update(await readFile('audit/2026-11-09/review-staged-release.mjs')).digest('hex'),
  fileCount: inventory.length, textFiles, allBytes, stagedNameStatusTokens, forbiddenPaths, indexMismatches, decodingIssues, findings, inventory,
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, status: result.status, fileCount: result.fileCount, textFiles, allBytes, forbiddenPaths, indexMismatches, decodingIssues, findingCount: findings.length, findings: findings.slice(0, 20) }));
process.exitCode = result.status === 'PASS-SCOPED' ? 0 : 1;
